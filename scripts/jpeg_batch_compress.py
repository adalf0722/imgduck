#!/usr/bin/env python3
"""
Batch JPEG compression by subdirectory gate rule.

Usage:
    python scripts/jpeg_batch_compress.py <target_dir> [--quality 80] [--threshold 50]
"""

from __future__ import annotations

import argparse
import os
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import List

from PIL import Image, ImageOps


IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".tif", ".tiff"}
JPEG_EXTS = {".jpg", ".jpeg"}


@dataclass
class Summary:
    scanned_subdirs: int = 0
    passed_subdirs: int = 0
    skipped_threshold_subdirs: int = 0
    skipped_error_subdirs: int = 0
    skipped_no_images_subdirs: int = 0
    compressed_files: int = 0
    failed_files: int = 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Compress images in each subdirectory with JPEG quality gate rule. "
            "If the first image does not save enough space, skip that subdirectory."
        )
    )
    parser.add_argument("target_dir", help="Target root directory")
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
    args = parser.parse_args()

    if not (1 <= args.quality <= 100):
        raise SystemExit("Error: --quality must be between 1 and 100")
    if args.threshold < 0:
        raise SystemExit("Error: --threshold must be >= 0")
    return args


def iter_subdirs(root: Path) -> List[Path]:
    subdirs: List[Path] = []
    for dirpath, _, _ in os.walk(root):
        current = Path(dirpath)
        if current == root:
            continue
        subdirs.append(current)
    subdirs.sort(key=lambda p: str(p))
    return subdirs


def list_images_in_dir(directory: Path) -> List[Path]:
    files = []
    for child in directory.iterdir():
        if child.is_file() and child.suffix.lower() in IMAGE_EXTS:
            files.append(child)
    files.sort(key=lambda p: p.name.lower())
    return files


def target_jpeg_path(src: Path) -> Path:
    if src.suffix.lower() in JPEG_EXTS:
        return src
    return src.with_suffix(".jpg")


def compress_to_temp_jpeg(src: Path, quality: int) -> Path:
    fd, tmp_name = tempfile.mkstemp(suffix=".jpg", prefix="imgduck_tmp_")
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


def process_subdir(directory: Path, quality: int, threshold: float, summary: Summary) -> None:
    images = list_images_in_dir(directory)
    if not images:
        summary.skipped_no_images_subdirs += 1
        print(f"[SKIP no images] {directory}")
        return

    first = images[0]
    print(f"\n[DIR] {directory}")
    print(f"  first image gate: {first.name}")

    try:
        first_tmp = compress_to_temp_jpeg(first, quality)
    except Exception as exc:
        summary.skipped_error_subdirs += 1
        summary.failed_files += 1
        print(f"  [SKIP by error] cannot compress first image: {exc}")
        return

    first_orig_size = first.stat().st_size
    first_new_size = first_tmp.stat().st_size
    first_saved = saving_percent(first_orig_size, first_new_size)

    print(
        f"  gate result: original={first_orig_size} bytes, "
        f"compressed={first_new_size} bytes, saved={first_saved:.2f}%"
    )

    if first_saved < threshold:
        summary.skipped_threshold_subdirs += 1
        first_tmp.unlink(missing_ok=True)
        print(f"  [SKIP by threshold] {first_saved:.2f}% < {threshold:.2f}%")
        return

    summary.passed_subdirs += 1
    try:
        replace_with_temp(first_tmp, first)
        summary.compressed_files += 1
        print(f"  [OK] replaced first image: {first.name}")
    except Exception as exc:
        summary.failed_files += 1
        first_tmp.unlink(missing_ok=True)
        print(f"  [ERROR] replace first image failed: {exc}")
        return

    for img_path in images[1:]:
        try:
            tmp = compress_to_temp_jpeg(img_path, quality)
            replace_with_temp(tmp, img_path)
            summary.compressed_files += 1
            print(f"  [OK] {img_path.name}")
        except Exception as exc:
            summary.failed_files += 1
            print(f"  [ERROR] {img_path.name}: {exc}")


def print_summary(summary: Summary) -> None:
    print("\n=== Summary ===")
    print(f"Scanned subdirectories : {summary.scanned_subdirs}")
    print(f"Passed threshold dirs  : {summary.passed_subdirs}")
    print(f"Skipped dirs (threshold): {summary.skipped_threshold_subdirs}")
    print(f"Skipped dirs (error)    : {summary.skipped_error_subdirs}")
    print(f"Skipped dirs (no images): {summary.skipped_no_images_subdirs}")
    print(f"Compressed files       : {summary.compressed_files}")
    print(f"Failed files           : {summary.failed_files}")


def main() -> int:
    args = parse_args()
    root = Path(args.target_dir).expanduser().resolve()

    if not root.exists() or not root.is_dir():
        print(f"Error: target_dir is not a directory: {root}")
        return 1

    summary = Summary()
    subdirs = iter_subdirs(root)
    summary.scanned_subdirs = len(subdirs)

    if not subdirs:
        print("No subdirectories found under target directory.")
        print_summary(summary)
        return 0

    print(f"Target directory: {root}")
    print(f"Quality         : {args.quality}")
    print(f"Threshold       : {args.threshold:.2f}%")
    print(f"Subdirectories  : {len(subdirs)}")

    for subdir in subdirs:
        process_subdir(subdir, args.quality, args.threshold, summary)

    print_summary(summary)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
