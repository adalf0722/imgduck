import { useCallback, useEffect, useMemo, useState } from 'react'
import { BatchList } from './components/BatchList'
import { CompressionSettings } from './components/CompressionSettings'
import { DownloadButton } from './components/DownloadButton'
import { ImagePreview } from './components/ImagePreview'
import { ImageUploader } from './components/ImageUploader'
import { useBatchCompression } from './hooks/useBatchCompression'
import { useFileDrop } from './hooks/useFileDrop'
import { formatFileSize } from './utils/fileUtils'
import type { CompressionOptions } from './types'

const DEFAULT_OPTIONS: CompressionOptions = {
  format: 'webp',
  quality: 80,
}

import splitPreview from './assets/preview/split.webp'
import sideBySidePreview from './assets/preview/side-by-side.webp'
import swipePreview from './assets/preview/swipe.webp'

const PREVIEW_SHOWCASE = [
  {
    key: 'split',
    title: 'Split slider',
    description: 'Drag the divider to view original and compressed in one frame.',
    image: splitPreview,
  },
  {
    key: 'side',
    title: 'Side-by-side',
    description: 'Lock both images next to each other with synced zoom and pan.',
    image: sideBySidePreview,
  },
  {
    key: 'swipe',
    title: 'Swipe & tap',
    description: 'Swipe or tap to toggle full view, perfect for spotting detail.',
    image: swipePreview,
  },
] as const

type PreviewShowcaseItem = (typeof PREVIEW_SHOWCASE)[number]

function App() {
  const [options, setOptions] = useState<CompressionOptions>(DEFAULT_OPTIONS)
  const [uiError, setUiError] = useState<string | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [previewModal, setPreviewModal] = useState<PreviewShowcaseItem | null>(null)
  const { items, activeItem, enqueueFiles, clear, activeId, setActiveId } =
    useBatchCompression(options)

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const normalized = Array.isArray(files) ? files : Array.from(files)
      if (!normalized.length) return
      const result = await enqueueFiles(files)
      if (result.errors.length) {
        setUiError(result.errors[0])
      } else {
        setUiError(null)
      }
    },
    [enqueueFiles],
  )

  const { dropRef, isDragging } = useFileDrop(handleFiles)

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      if (event.clipboardData?.files?.length) {
        void handleFiles(event.clipboardData.files)
      }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [handleFiles])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && items.length) clear()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [clear, items.length])

  useEffect(() => {
    if (!previewModal) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPreviewModal(null)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [previewModal])

  const activeOriginal = activeItem?.info ?? null
  const activeCompressed = activeItem?.compressed ?? null
  const activeStatus = activeItem?.status ?? 'queued'

  const ratio = useMemo(() => {
    if (!activeOriginal || !activeCompressed) return null
    const saved = activeOriginal.size - activeCompressed.size
    const percent = (1 - activeCompressed.size / activeOriginal.size) * 100
    return { saved, percent }
  }, [activeCompressed, activeOriginal])

  const originalSizeText = activeOriginal ? formatFileSize(activeOriginal.size) : '--'
  const compressedSizeText = activeCompressed ? formatFileSize(activeCompressed.size) : '--'
  const savedSizeText = ratio ? formatFileSize(ratio.saved) : '--'
  const savedPercentText = ratio ? ratio.percent.toFixed(1) : null
  const barWidth =
    activeOriginal && activeCompressed
      ? Math.min(100, Math.max(5, (activeCompressed.size / activeOriginal.size) * 100))
      : 100

  const hasItems = items.length > 0

  const previewLightbox = previewModal ? (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm px-4"
      onClick={() => setPreviewModal(null)}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative w-full aspect-video bg-slate-100">
          <img
            src={previewModal.image}
            alt={previewModal.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
        <div className="p-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <p className="text-xl font-semibold text-slate-900">{previewModal.title}</p>
            <p className="text-sm text-slate-600 mt-1">{previewModal.description}</p>
          </div>
          <button
            type="button"
            onClick={() => setPreviewModal(null)}
            className="duck-button text-xs px-4 py-2 self-end md:self-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  ) : null

  useEffect(() => {
    if (!items.length) {
      setUiError(null)
    }
  }, [items.length])

  if (!hasItems) {
    return (
      <div
        ref={dropRef}
        className={`min-h-screen text-slate-50 transition ${
          isDragging ? 'bg-slate-200/40' : ''
        }`}
      >
        {uiError && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-30 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200 shadow-lg">
            {uiError}
          </div>
        )}
        <div className="max-w-5xl mx-auto px-4 pt-16 pb-24 space-y-8">
          <header className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="duck-logo text-2xl">🐣</div>
              <div>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-[0.2em]">
                  Imgduck
                </p>
                <h1 className="text-4xl font-extrabold text-slate-900">
                  Cute duck, your compression buddy
                </h1>
              </div>
            </div>
            <p className="text-slate-600 text-lg md:text-xl max-w-5xl leading-relaxed">
              Drag, paste, or pick an entire folder to start compressing instantly—everything stays on
              your device. <span className="whitespace-nowrap">Supports WebP · MozJPEG · OxiPNG</span>
              <span className="md:whitespace-nowrap">, and every file joins the batch queue.</span>
            </p>
            <div className="grid gap-3 md:grid-cols-3 text-slate-700">
              <div className="glass-card rounded-2xl px-4 py-3">
                <p className="font-semibold text-slate-900">Batch queue</p>
                <p className="text-sm">Drop multiple files or whole folders, compressing one by one with progress.</p>
              </div>
              <div className="glass-card rounded-2xl px-4 py-3">
                <p className="font-semibold text-slate-900">Compare tools</p>
                <p className="text-sm">Split, side-by-side, and swipe modes with synced zoom and mouse wheel support.</p>
              </div>
              <div className="glass-card rounded-2xl px-4 py-3">
                <p className="font-semibold text-slate-900">ZIP export</p>
                <p className="text-sm">Download single results or export everything at once as a ZIP archive.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-[0.2em]">
                  Preview modes
                </p>
                <p className="text-slate-600 text-sm">
                  Explore the compare tools before uploading your own images.
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-3">
                {PREVIEW_SHOWCASE.map((item) => (
                  <button
                    type="button"
                    key={item.key}
                    onClick={() => setPreviewModal(item)}
                    className="text-left rounded-3xl border border-white/70 bg-white/80 shadow-xl overflow-hidden flex flex-col transition-transform duration-300 group hover:-translate-y-1 hover:shadow-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
                    aria-label={`View ${item.title} mode preview`}
                  >
                    <div className="relative w-full aspect-video bg-slate-100 overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.title}
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-4 flex flex-col gap-2">
                      <p className="text-lg font-semibold text-slate-900">{item.title}</p>
                      <p className="text-sm text-slate-600">{item.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </header>
          <ImageUploader
            onFiles={handleFiles}
            onFolderSelect={handleFiles}
            isDragging={isDragging}
            count={items.length}
          />
        </div>
        {previewLightbox}
      </div>
    )
  }

  return (
    <div ref={dropRef} className="min-h-screen text-slate-50">
      {uiError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-30 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200 shadow-lg">
          {uiError}
        </div>
      )}

      <div className="fixed inset-0 z-0">
        <ImagePreview
          originalImage={activeOriginal}
          compressedImage={activeCompressed}
          status={activeStatus}
          className="border border-slate-800/60"
        />
      </div>

      <div className="pointer-events-none fixed inset-0 z-20">
        <button
          type="button"
          onClick={clear}
          className="pointer-events-auto fixed top-4 left-4 text-xs px-3 py-2 rounded-full border border-slate-200 text-slate-800 hover:border-brand transition bg-white/90 shadow-lg z-30"
          aria-label="Close preview"
        >
          X
        </button>

        <div className="pointer-events-auto fixed top-16 left-4 flex flex-col gap-3 w-[320px] max-w-[90vw] z-20">
          {isSettingsOpen && (
            <div className="rounded-3xl p-4 shadow-2xl bg-white/95 border border-white/70 text-slate-800">
              <CompressionSettings
                options={options}
                onChange={setOptions}
                disabled={!activeOriginal}
              />
            </div>
          )}
          <button
            type="button"
            onClick={() => setIsSettingsOpen((v) => !v)}
            className="duck-button w-full flex items-center justify-center text-xs"
          >
            {isSettingsOpen ? 'Hide settings' : 'Show settings'}
          </button>

          <div className="rounded-3xl p-4 shadow-2xl bg-white text-slate-900 border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Output</p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full border ${
                  activeCompressed && activeStatus === 'done'
                    ? 'border-emerald-400 text-emerald-600 bg-emerald-50'
                    : 'border-slate-300 text-slate-500 bg-white/60'
                }`}
              >
                {activeCompressed && activeStatus === 'done' ? 'Ready' : 'Processing'}
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200 p-3 text-sm text-slate-800 mb-3 space-y-2 bg-white">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Original size</span>
                <span className="text-slate-800">{originalSizeText}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-brand transition-all"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-2xl font-bold text-slate-900 leading-tight">
                    {activeCompressed ? compressedSizeText : '--'}
                  </p>
                  <p className="text-xs text-slate-600">Compressed size</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-emerald-600 leading-tight">
                    {savedPercentText ? `${savedPercentText}% saved` : '--'}
                  </p>
                  <p className="text-xs text-slate-600">Saved {activeCompressed ? savedSizeText : '--'}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Format</span>
                <span className="text-slate-800 font-semibold uppercase">
                  {activeCompressed ? activeCompressed.format : '--'}
                </span>
              </div>
            </div>

            <DownloadButton
              compressedImage={activeCompressed}
              disabled={!activeCompressed || activeStatus !== 'done'}
            label={activeCompressed ? `Download (${compressedSizeText})` : 'Download'}
            />
          </div>
        </div>

        {items.length > 0 && (
          <BatchList items={items} activeId={activeId} onSelect={setActiveId} onClear={clear} />
        )}
      </div>
      {previewLightbox}
    </div>
  )
}

export default App


