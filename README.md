# Imgduck

Imgduck is a fully client-side image compression playground built with React + TypeScript + Vite. Drag files, paste from the clipboard, or upload whole folders to build a batch queue, compare quality in full screen, and download results individually or as a ZIP — all in your browser.

![screenshot](./duck.webp)

Languages: [English](README.md) · [繁體中文](README.zh-TW.md)

> [!NOTE]
> Demo: https://adalf0722.github.io/imgduck/

## Highlights

- **Local-only compression** — Every operation runs inside the browser for maximum privacy.
- **Flexible inputs** — Drag-and-drop, click-to-upload, clipboard paste, and folder selection feed the batch queue.
- **Batch workflow** — Each item shows status, saved size, and has one-click or ZIP download options; download buttons stay prominent and show compressed size.
- **Visual comparison** — Split, side-by-side, and swipe modes with synced zoom/pan; the preview lightbox supports prev/next (buttons + arrow keys).
- **Friendly UI** — Compression settings open by default on desktop (still hideable); floating pastel panels keep the image full screen while controls stay within reach.
- **Multiple formats** — MozJPEG (default), WebP, and OxiPNG with quality and max-dimension controls.

## Tech Stack

| Category | Tools |
| --- | --- |
| Framework | React 18, TypeScript 5 |
| Build | Vite 5 |
| Styling | Tailwind CSS + custom pastel theme |
| Image processing | browser-image-compression, Canvas API, JSZip |

## Project Structure

```
src/
├── components/       # ImageUploader, ImagePreview, BatchList, CompressionSettings, etc.
├── hooks/            # useBatchCompression, useFileDrop, useImageCompression
├── utils/            # compression helpers, file utilities
├── types/            # shared TypeScript types
├── main.tsx          # entry point
└── index.css         # theme styles
```

## Development

```bash
npm install       # install dependencies
npm run dev       # start dev server (http://localhost:5173)
npm run lint      # lint the codebase
npm run build     # production build
```

## Notes for Contributors

- `src/hooks/useBatchCompression.ts` controls the queue, validation, compression flow, and ZIP export—extend here for workers or custom presets.
- `src/components/ImagePreview.tsx` manages comparison modes, zoom/pan, and swipe gestures; adjust when enhancing the viewing experience.
- `src/components/BatchList.tsx` renders queue progress and downloads; good for features such as sorting, grouping, or filtering.
- The duck logo uses the `.duck-logo` class; swap in assets under `public/` or emoji as needed.

## License

This project is provided for demonstration purposes—adapt, deploy, and remix it for your own team or personal workflow.
