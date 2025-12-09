import { useCallback, useEffect, useMemo, useState } from 'react'
import { BatchList } from './components/BatchList'
import { CompressionSettings } from './components/CompressionSettings'
import { DownloadButton } from './components/DownloadButton'
import { ImagePreview } from './components/ImagePreview'
import { ImageUploader } from './components/ImageUploader'
import { useBatchCompression } from './hooks/useBatchCompression'
import { useFileDrop } from './hooks/useFileDrop'
import { useIsMobile } from './hooks/useIsMobile'
import { formatFileSize } from './utils/fileUtils'
import type { BatchItem, BatchStatus, CompressionFormat, CompressionOptions } from './types'
import splitPreview from './assets/preview/split.webp'
import sideBySidePreview from './assets/preview/side-by-side.webp'
import swipePreview from './assets/preview/swipe.webp'

const DEFAULT_OPTIONS: CompressionOptions = {
  format: 'mozjpeg',
  quality: 80,
}

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

const BATCH_STATUS_TEXT: Record<BatchStatus, string> = {
  queued: 'Queued',
  processing: 'Compressing',
  done: 'Done',
  error: 'Failed',
}

const FORMAT_EXT_MAP: Record<CompressionFormat, string> = {
  webp: 'webp',
  mozjpeg: 'jpg',
  oxipng: 'png',
}

function App() {
  const [options, setOptions] = useState<CompressionOptions>(DEFAULT_OPTIONS)
  const [uiError, setUiError] = useState<string | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(true)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const [mobileShowcaseIndex, setMobileShowcaseIndex] = useState(0)
  const [mobilePanel, setMobilePanel] = useState<'settings' | 'output' | 'queue' | null>(null)
  const isMobile = useIsMobile()

  const handlePrevShowcase = () => {
    setMobileShowcaseIndex((index) => Math.max(0, index - 1))
  }

  const handleNextShowcase = () => {
    setMobileShowcaseIndex((index) => Math.min(PREVIEW_SHOWCASE.length - 1, index + 1))
  }

  const mobileActionButtonClass =
    'rounded-full bg-brand text-slate-900 font-semibold px-4 py-2 text-xs shadow-lg disabled:opacity-40 disabled:cursor-not-allowed'

  const openMobilePanel = (panel: 'settings' | 'output' | 'queue') => {
    setMobilePanel(panel)
  }

  const openPreview = (index: number) => {
    setPreviewIndex(index)
  }

  const closePreview = () => {
    setPreviewIndex(null)
  }

  const downloadItem = (item: BatchItem) => {
    if (!item.compressed) return
    const ext = FORMAT_EXT_MAP[item.compressed.format]
    const nameWithoutExt = item.info.file.name.replace(/\.[^.]+$/, '')
    const link = document.createElement('a')
    link.href = item.compressed.url
    link.download = `${nameWithoutExt || 'image'}_compressed.${ext}`
    link.click()
  }

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

  const previewModal = useMemo(
    () => (previewIndex === null ? null : PREVIEW_SHOWCASE[previewIndex]),
    [previewIndex],
  )

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
      if (event.key === 'Escape') {
        closePreview()
      } else if (event.key === 'ArrowLeft') {
        setPreviewIndex((index) => {
          if (index === null) return index
          return Math.max(0, index - 1)
        })
      } else if (event.key === 'ArrowRight') {
        setPreviewIndex((index) => {
          if (index === null) return index
          return Math.min(PREVIEW_SHOWCASE.length - 1, index + 1)
        })
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [previewModal])

  useEffect(() => {
    if (!isMobile) {
      setMobilePanel(null)
    }
  }, [isMobile])

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

  const renderOutputCard = () => (
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
          <div className="h-full bg-brand transition-all" style={{ width: `${barWidth}%` }} />
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
        originalName={activeOriginal?.file.name}
        disabled={!activeCompressed || activeStatus !== 'done'}
        label={activeCompressed ? `Download (${compressedSizeText})` : 'Download'}
      />
    </div>
  )

  const hasItems = items.length > 0

  const previewLightbox = previewModal ? (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm px-4"
      onClick={closePreview}
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
          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                setPreviewIndex((index) => {
                  if (index === null) return index
                  return Math.max(0, index - 1)
                })
              }}
              disabled={previewIndex === 0}
              className="duck-button text-xs px-3 py-2 disabled:opacity-40"
              aria-label="Previous preview"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                setPreviewIndex((index) => {
                  if (index === null) return index
                  return Math.min(PREVIEW_SHOWCASE.length - 1, index + 1)
                })
              }}
              disabled={previewIndex === PREVIEW_SHOWCASE.length - 1}
              className="duck-button text-xs px-3 py-2 disabled:opacity-40"
              aria-label="Next preview"
            >
              Next
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                closePreview()
              }}
              className="duck-button text-xs px-4 py-2"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null

  const renderMobilePanel = () => {
    if (!isMobile || !mobilePanel) return null
    const close = () => setMobilePanel(null)
    let title = ''
    let content: JSX.Element | null = null

    if (mobilePanel === 'settings') {
      title = 'Compression settings'
      content = (
        <CompressionSettings options={options} onChange={setOptions} disabled={!activeOriginal} />
      )
    } else if (mobilePanel === 'output') {
      title = 'Output'
      content = renderOutputCard()
    } else if (mobilePanel === 'queue') {
      title = 'Batch queue'
      content =
        items.length === 0 ? (
          <p className="text-sm text-slate-500">No files in the queue yet.</p>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveId(item.id)
                    close()
                  }}
                  className={`w-full text-left rounded-2xl border p-3 ${
                    item.id === activeId ? 'border-brand bg-brand/10' : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold truncate">{item.info.file.name}</p>
                    <span className="text-xs text-slate-600">{BATCH_STATUS_TEXT[item.status]}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>{formatFileSize(item.info.size)}</span>
                    {item.status === 'done' && item.compressed ? (
                      <button
                        type="button"
                        className="duck-button text-xs px-3 py-1 bg-brand text-slate-900 font-semibold disabled:opacity-60"
                        onClick={(event) => {
                          event.stopPropagation()
                          downloadItem(item)
                        }}
                      >
                        {item.compressed ? `Download (${formatFileSize(item.compressed.size)})` : 'Download'}
                      </button>
                    ) : item.status === 'error' ? (
                      <span className="text-red-500">{item.error ?? 'Compression failed'}</span>
                    ) : (
                      <span>{item.status === 'processing' ? 'Compressing…' : 'Waiting'}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                clear()
                close()
              }}
              className="w-full text-sm text-red-500 font-semibold"
            >
              Clear queue
            </button>
          </div>
        )
    }

    return (
      <div
        className="fixed inset-0 z-40 bg-slate-900/70 backdrop-blur-sm flex items-end"
        onClick={close}
      >
        <div
          className="w-full rounded-t-3xl bg-white shadow-2xl p-5 space-y-4 pointer-events-auto"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold text-slate-900">{title}</p>
            <button
              type="button"
              onClick={close}
              className="text-xs font-semibold text-slate-600 px-3 py-1 rounded-full bg-slate-100"
            >
              Close
            </button>
          </div>
          {content}
        </div>
      </div>
    )
  }

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
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {['Drag & drop folders', 'Paste from clipboard', 'Batch queue', 'ZIP export'].map((label) => (
                    <span
                      key={label}
                      className="rounded-full bg-brand text-slate-900 text-xs font-semibold px-3 py-1 shadow"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-slate-600 text-lg md:text-xl max-w-5xl leading-relaxed">
              All in-browser · No uploads · WebP · MozJPEG · OxiPNG
            </p>
            <div className="grid gap-3 md:grid-cols-3 text-slate-700">
              <div className="glass-card rounded-2xl px-4 py-3">
                <p className="font-semibold text-slate-900">Batch queue</p>
                <p className="text-sm">Drop files/folders once; we queue and compress with status.</p>
              </div>
              <div className="glass-card rounded-2xl px-4 py-3">
                <p className="font-semibold text-slate-900">Compare tools</p>
                <p className="text-sm">Split, side-by-side, swipe modes with synced zoom/pan.</p>
              </div>
              <div className="glass-card rounded-2xl px-4 py-3">
                <p className="font-semibold text-slate-900">ZIP export</p>
                <p className="text-sm">Download singles or export the whole batch as a ZIP archive.</p>
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
              <div className="md:hidden space-y-3">
                <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/80 shadow-xl">
                  <div
                    className="flex transition-transform duration-300"
                    style={{ transform: `translateX(-${mobileShowcaseIndex * 100}%)` }}
                  >
                    {PREVIEW_SHOWCASE.map((item, index) => (
                      <button
                        type="button"
                        key={item.key}
                        onClick={() => openPreview(index)}
                        className="text-left min-w-full flex-shrink-0 flex flex-col overflow-hidden group"
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
                        <div className="p-4 flex flex-col gap-2 bg-white">
                          <p className="text-lg font-semibold text-slate-900">{item.title}</p>
                          <p className="text-sm text-slate-600">{item.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handlePrevShowcase}
                    disabled={mobileShowcaseIndex === 0}
                    className="duck-button text-xs disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <div className="flex items-center gap-2">
                    {PREVIEW_SHOWCASE.map((item, index) => (
                      <span
                        key={item.key}
                        className={`h-2 w-2 rounded-full ${
                          mobileShowcaseIndex === index ? 'bg-slate-900' : 'bg-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleNextShowcase}
                    disabled={mobileShowcaseIndex === PREVIEW_SHOWCASE.length - 1}
                    className="duck-button text-xs disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
              <div className="hidden md:grid md:grid-cols-3 gap-6">
                {PREVIEW_SHOWCASE.map((item, index) => (
                  <button
                    type="button"
                    key={item.key}
                    onClick={() => openPreview(index)}
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
            isDragging={isDragging}
            count={items.length}
          />
          <footer className="mt-10 pb-12 flex items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-slate-600 bg-white/70 border border-white/60 rounded-full px-4 py-2 shadow">
              <span className="text-slate-500">🐣</span>
              <a
                href="https://github.com/adalf0722/imgduck"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-slate-700 hover:text-slate-900"
              >
                Source on GitHub
              </a>
            </div>
          </footer>
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

        {!isMobile && (
          <>
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

              {renderOutputCard()}
            </div>

            {items.length > 0 && (
              <BatchList items={items} activeId={activeId} onSelect={setActiveId} onClear={clear} />
            )}
          </>
        )}

        {isMobile && (
          <div className="pointer-events-auto fixed bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-white/90 border border-white/60 rounded-full px-4 py-2 shadow-lg z-30">
            <button
              type="button"
              onClick={() => openMobilePanel('settings')}
              className={mobileActionButtonClass}
              disabled={!activeOriginal}
            >
              Settings
            </button>
            <button
              type="button"
              onClick={() => openMobilePanel('output')}
              className={mobileActionButtonClass}
              disabled={!activeOriginal}
            >
              Output
            </button>
            <button
              type="button"
              onClick={() => openMobilePanel('queue')}
              className={mobileActionButtonClass}
              disabled={!items.length}
            >
              Queue
            </button>
          </div>
        )}
      </div>
      {previewLightbox}
      {renderMobilePanel()}
    </div>
  )
}

export default App


