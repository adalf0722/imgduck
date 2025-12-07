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

function App() {
  const [options, setOptions] = useState<CompressionOptions>(DEFAULT_OPTIONS)
  const [uiError, setUiError] = useState<string | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
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
          </header>
          <ImageUploader
            onFiles={handleFiles}
            onFolderSelect={handleFiles}
            isDragging={isDragging}
            count={items.length}
          />
        </div>
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
    </div>
  )
}

export default App


