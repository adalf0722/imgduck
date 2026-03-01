#!/usr/bin/env python3
"""
Batch JPEG compression by subdirectory gate rule.

Usage:
    python scripts/jpeg_batch_compress.py <target_dir> [--quality 80] [--threshold 50]
"""

from __future__ import annotations

import argparse
import json
import os
import tempfile
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from PIL import Image, ImageOps

# Raise Pillow's decompression-bomb guard for very large valid images.
Image.MAX_IMAGE_PIXELS = 400_000_000

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".tif", ".tiff"}
JPEG_EXTS = {".jpg", ".jpeg"}
PROGRESS_FILENAME = ".jpeg_batch_progress.json"
PROGRESS_VERSION = 1

STATUS_PENDING = "pending"
STATUS_RUNNING = "running"
STATUS_DONE = "done"
STATUS_SKIPPED_THRESHOLD = "skipped_threshold"
STATUS_SKIPPED_NO_IMAGES = "skipped_no_images"
STATUS_FAILED = "failed"


@dataclass
class Summary:
    scanned_subdirs: int = 0
    passed_subdirs: int = 0
    skipped_threshold_subdirs: int = 0
    skipped_error_subdirs: int = 0
    skipped_no_images_subdirs: int = 0
    compressed_files: int = 0
    failed_files: int = 0


@dataclass
class ProcessResult:
    status: str
    message: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Compress images in each subdirectory with JPEG quality gate rule. "
            "If the first image does not save enough space, skip that subdirectory."
        )
    )
    parser.add_argument("target_dir", help="Target root directory or single image path")
    parser.add_argument(
        "--quality",
        type=int,
        default=80,
        help="JPEG quality (default: 80)",
    )
    parser.add_argument(
        "--threshold",
        type=float,
        default=50.0,
        help="Saving threshold percent for first image gate (default: 50)",
    )
    parser.add_argument(
        "--restart",
        action="store_true",
        help="Ignore existing progress file and rebuild TODO list from scratch",
    )
    parser.add_argument(
        "--retry-failed",
        action="store_true",
        help="When resuming, retry directories marked as failed",
    )

    args = parser.parse_args()

    if not (1 <= args.quality <= 100):
        raise SystemExit("Error: --quality must be between 1 and 100")
    if args.threshold < 0:
        raise SystemExit("Error: --threshold must be >= 0")
    return args


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def iter_subdirs(root: Path) -> List[Path]:
    subdirs: List[Path] = []
    for dirpath, _, _ in os.walk(root):
        current = Path(dirpath)
        if current == root:
            continue
        subdirs.append(current)
    subdirs.sort(key=lambda p: str(p))
    return subdirs


def list_images_in_dir(directory: Path, preferred_first: Optional[Path] = None) -> List[Path]:
    files = []
    for child in directory.iterdir():
        if child.is_file() and child.suffix.lower() in IMAGE_EXTS:
            files.append(child)
    files.sort(key=lambda p: p.name.lower())

    if preferred_first is not None:
        preferred_resolved = preferred_first.resolve()
        for i, path in enumerate(files):
            if path.resolve() == preferred_resolved:
                files.insert(0, files.pop(i))
                break

    return files


def target_jpeg_path(src: Path) -> Path:
    if src.suffix.lower() in JPEG_EXTS:
        return src
    return src.with_suffix(".jpg")


def compress_to_temp_jpeg(src: Path, quality: int) -> Path:
    fd, tmp_name = tempfile.mkstemp(
        suffix=".jpg",
        prefix="imgduck_tmp_",
        dir=str(src.parent),
    )
    os.close(fd)
    tmp_path = Path(tmp_name)
    try:
        with Image.open(src) as img:
            normalized = ImageOps.exif_transpose(img).convert("RGB")
            normalized.save(tmp_path, format="JPEG", quality=quality, optimize=True)
    except Exception:
        if tmp_path.exists():
            tmp_path.unlink(missing_ok=True)
        raise
    return tmp_path


def replace_with_temp(temp_jpeg: Path, src: Path) -> None:
    dst = target_jpeg_path(src)
    os.replace(temp_jpeg, dst)
    if src.resolve() != dst.resolve() and src.exists():
        src.unlink(missing_ok=True)


def saving_percent(original_size: int, compressed_size: int) -> float:
    if original_size <= 0:
        return 0.0
    return (original_size - compressed_size) / original_size * 100.0


def write_json_atomic(path: Path, data: Dict[str, Any]) -> None:
    fd, tmp_name = tempfile.mkstemp(
        suffix=".tmp",
        prefix=f"{path.name}.",
        dir=str(path.parent),
    )
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.write("\n")
        os.replace(tmp_name, path)
    except Exception:
        Path(tmp_name).unlink(missing_ok=True)
        raise


def compute_progress_counters(items: List[Dict[str, Any]]) -> Dict[str, int]:
    counters = {"total": len(items), "done": 0, "failed": 0, "skipped": 0, "pending": 0}
    for item in items:
        status = item.get("status")
        if status == STATUS_DONE:
            counters["done"] += 1
        elif status == STATUS_FAILED:
            counters["failed"] += 1
        elif status in (STATUS_SKIPPED_THRESHOLD, STATUS_SKIPPED_NO_IMAGES):
            counters["skipped"] += 1
        elif status in (STATUS_PENDING, STATUS_RUNNING):
            counters["pending"] += 1
    return counters


def build_progress_state(subdirs: List[Path], run_config: Dict[str, Any]) -> Dict[str, Any]:
    ts = now_iso()
    items = []
    for directory in subdirs:
        items.append(
            {
                "dir": str(directory.resolve()),
                "status": STATUS_PENDING,
                "message": "",
                "started_at": None,
                "finished_at": None,
            }
        )
    return {
        "version": PROGRESS_VERSION,
        "run_config": run_config,
        "created_at": ts,
        "updated_at": ts,
        "items": items,
        "counters": compute_progress_counters(items),
    }


def save_progress(path: Path, state: Dict[str, Any]) -> None:
    state["updated_at"] = now_iso()
    state["counters"] = compute_progress_counters(state.get("items", []))
    write_json_atomic(path, state)


def validate_progress_state(
    state: Dict[str, Any],
    run_config: Dict[str, Any],
    subdirs: List[Path],
) -> Tuple[bool, str]:
    if state.get("version") != PROGRESS_VERSION:
        return False, "progress file version mismatch"

    if state.get("run_config") != run_config:
        return False, "run configuration mismatch"

    items = state.get("items")
    if not isinstance(items, list):
        return False, "progress file has invalid items"

    expected_dirs = [str(p.resolve()) for p in subdirs]
    state_dirs = [str(item.get("dir")) for item in items if isinstance(item, dict)]
    if state_dirs != expected_dirs:
        return False, "directory list mismatch"

    return True, ""


def load_or_create_progress(
    progress_path: Path,
    run_config: Dict[str, Any],
    subdirs: List[Path],
    restart: bool,
) -> Tuple[Dict[str, Any], bool]:
    if restart or not progress_path.exists():
        state = build_progress_state(subdirs, run_config)
        save_progress(progress_path, state)
        return state, False

    try:
        with progress_path.open("r", encoding="utf-8") as f:
            state = json.load(f)
    except Exception as exc:
        raise SystemExit(
            f"Error: progress file is unreadable or invalid JSON: {progress_path}\n"
            f"Detail: {exc}\n"
            "Use --restart to rebuild progress."
        )

    valid, reason = validate_progress_state(state, run_config, subdirs)
    if not valid:
        raise SystemExit(
            f"Error: existing progress file is incompatible ({reason}): {progress_path}\n"
            "Use --restart to rebuild progress."
        )

    changed = False
    for item in state.get("items", []):
        if item.get("status") == STATUS_RUNNING:
            item["status"] = STATUS_PENDING
            item["message"] = "Recovered from interrupted run"
            item["started_at"] = None
            item["finished_at"] = None
            changed = True
    if changed:
        save_progress(progress_path, state)

    return state, True


def classify_runnable_items(
    state: Dict[str, Any],
    retry_failed: bool,
) -> Tuple[List[int], int, int]:
    run_indices: List[int] = []
    pending_count = 0
    failed_retry_count = 0

    for i, item in enumerate(state.get("items", [])):
        status = item.get("status")
        if status == STATUS_PENDING:
            pending_count += 1
            run_indices.append(i)
        elif status == STATUS_FAILED and retry_failed:
            failed_retry_count += 1
            run_indices.append(i)

    return run_indices, pending_count, failed_retry_count


def format_progress_line(state: Dict[str, Any]) -> str:
    counters = compute_progress_counters(state.get("items", []))
    return (
        f"Progress: done={counters['done']}, failed={counters['failed']}, "
        f"skipped={counters['skipped']}, pending={counters['pending']}"
    )


def process_subdir(
    directory: Path,
    quality: int,
    threshold: float,
    summary: Summary,
    preferred_first: Optional[Path] = None,
) -> ProcessResult:
    images = list_images_in_dir(directory, preferred_first=preferred_first)
    if not images:
        summary.skipped_no_images_subdirs += 1
        return ProcessResult(status=STATUS_SKIPPED_NO_IMAGES, message="no images")

    first = images[0]

    try:
        first_tmp = compress_to_temp_jpeg(first, quality)
    except Exception as exc:
        summary.skipped_error_subdirs += 1
        summary.failed_files += 1
        return ProcessResult(status=STATUS_FAILED, message=f"cannot compress first image: {exc}")

    first_orig_size = first.stat().st_size
    first_new_size = first_tmp.stat().st_size
    first_saved = saving_percent(first_orig_size, first_new_size)

    if first_saved < threshold:
        summary.skipped_threshold_subdirs += 1
        first_tmp.unlink(missing_ok=True)
        return ProcessResult(
            status=STATUS_SKIPPED_THRESHOLD,
            message=f"{first_saved:.2f}% < {threshold:.2f}%",
        )

    summary.passed_subdirs += 1

    try:
        replace_with_temp(first_tmp, first)
        summary.compressed_files += 1
    except Exception as exc:
        summary.failed_files += 1
        first_tmp.unlink(missing_ok=True)
        return ProcessResult(status=STATUS_FAILED, message=f"replace first image failed: {exc}")

    failed_count = 0
    for img_path in images[1:]:
        try:
            tmp = compress_to_temp_jpeg(img_path, quality)
            replace_with_temp(tmp, img_path)
            summary.compressed_files += 1
        except Exception:
            summary.failed_files += 1
            failed_count += 1

    if failed_count > 0:
        return ProcessResult(
            status=STATUS_FAILED,
            message=f"{failed_count} file(s) failed after gate pass",
        )

    return ProcessResult(status=STATUS_DONE, message=f"saved={first_saved:.2f}%")


def print_summary(summary: Summary) -> None:
    print("\n=== Summary ===")
    print(f"Scanned subdirectories : {summary.scanned_subdirs}")
    print(f"Passed threshold dirs  : {summary.passed_subdirs}")
    print(f"Skipped dirs (threshold): {summary.skipped_threshold_subdirs}")
    print(f"Skipped dirs (error)    : {summary.skipped_error_subdirs}")
    print(f"Skipped dirs (no images): {summary.skipped_no_images_subdirs}")
    print(f"Compressed files       : {summary.compressed_files}")
    print(f"Failed files           : {summary.failed_files}")


def resolve_targets(target: Path) -> Tuple[Path, str, Optional[Path], List[Path]]:
    preferred_first: Optional[Path] = None

    if target.is_file():
        if target.suffix.lower() not in IMAGE_EXTS:
            raise SystemExit(f"Error: file type is not supported image: {target}")
        root = target.parent.resolve()
        mode = "single-file"
        subdirs = [root]
        preferred_first = target.resolve()
    elif target.is_dir():
        root = target.resolve()
        mode = "directory"
        subdirs = iter_subdirs(root)
    else:
        raise SystemExit(f"Error: target path is neither file nor directory: {target}")

    return root, mode, preferred_first, subdirs


def main() -> int:
    args = parse_args()
    target = Path(args.target_dir).expanduser().resolve()

    if not target.exists():
        print(f"Error: target path does not exist: {target}")
        return 1

    try:
        root, mode, preferred_first, subdirs = resolve_targets(target)
    except SystemExit as exc:
        print(exc)
        return 1

    summary = Summary(scanned_subdirs=len(subdirs))

    run_config: Dict[str, Any] = {
        "target_root": str(root),
        "quality": args.quality,
        "threshold": args.threshold,
        "mode": mode,
        "preferred_first": str(preferred_first) if preferred_first else None,
    }

    progress_path = root / PROGRESS_FILENAME

    try:
        state, resumed = load_or_create_progress(
            progress_path=progress_path,
            run_config=run_config,
            subdirs=subdirs,
            restart=args.restart,
        )
    except SystemExit as exc:
        print(exc)
        return 1

    run_indices, pending_count, failed_retry_count = classify_runnable_items(
        state,
        retry_failed=args.retry_failed,
    )

    print(f"Target directory: {root}")
    print(f"Quality         : {args.quality}")
    print(f"Threshold       : {args.threshold:.2f}%")
    print(f"Subdirectories  : {len(subdirs)}")
    print(f"Progress file   : {progress_path}")
    print(f"Resume mode     : {'on' if resumed and not args.restart else 'off'}")
    print(f"Will run        : pending={pending_count}, failed_to_retry={failed_retry_count}")
    print(format_progress_line(state))

    if not state.get("items"):
        print("No subdirectories found under target directory.")
        print_summary(summary)
        print(format_progress_line(state))
        print(f"Progress file: {progress_path}")
        return 0

    total = len(state["items"])
    for idx in run_indices:
        item = state["items"][idx]
        directory = Path(item["dir"])

        item["status"] = STATUS_RUNNING
        item["message"] = ""
        item["started_at"] = now_iso()
        item["finished_at"] = None
        save_progress(progress_path, state)

        print(f"[{idx + 1}/{total}] [RUN ] {directory}")

        current_preferred = preferred_first if preferred_first and directory == root else None
        result = process_subdir(
            directory=directory,
            quality=args.quality,
            threshold=args.threshold,
            summary=summary,
            preferred_first=current_preferred,
        )

        item["status"] = result.status
        item["message"] = result.message
        item["finished_at"] = now_iso()
        save_progress(progress_path, state)

        if result.status == STATUS_DONE:
            print(f"[{idx + 1}/{total}] [DONE] {directory} ({result.message})")
        elif result.status == STATUS_SKIPPED_THRESHOLD:
            print(f"[{idx + 1}/{total}] [SKIP threshold] {directory} ({result.message})")
        elif result.status == STATUS_SKIPPED_NO_IMAGES:
            print(f"[{idx + 1}/{total}] [SKIP no images] {directory}")
        else:
            print(f"[{idx + 1}/{total}] [FAIL] {directory} {result.message}")

    print_summary(summary)
    print(format_progress_line(state))
    print(f"Progress file: {progress_path}")

    counters = compute_progress_counters(state.get("items", []))
    if counters["pending"] > 0 or counters["failed"] > 0:
        print("Next run:")
        print("  - Resume pending: rerun same command")
        print("  - Retry failed : add --retry-failed")
        print("  - Start over   : add --restart")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
