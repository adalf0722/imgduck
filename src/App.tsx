import { useCallback, useEffect, useMemo, useState } from 'react'
import { CompressionSettings } from './components/CompressionSettings'
import { DownloadButton } from './components/DownloadButton'
import { ImagePreview } from './components/ImagePreview'
import { ImageUploader } from './components/ImageUploader'
import { useFileDrop } from './hooks/useFileDrop'
import { useImageCompression } from './hooks/useImageCompression'
import { formatFileSize, getImageInfo, validateImageFile } from './utils/fileUtils'
import type { CompressionOptions } from './types'

const DEFAULT_OPTIONS: CompressionOptions = {
  format: 'webp',
  quality: 80,
}

function App() {
  const {
    originalImage,
    compressedImage,
    isCompressing,
    error,
    setOriginalImage,
    compress,
    reset,
  } = useImageCompression()
  const [options, setOptions] = useState<CompressionOptions>(DEFAULT_OPTIONS)
  const [uiError, setUiError] = useState<string | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const file = files[0]
      if (!file) return
      const validation = validateImageFile(file)
      if (!validation.valid) {
        setUiError(validation.error ?? 'File type not supported')
        return
      }

      setUiError(null)
      try {
        const info = await getImageInfo(file)
        setOriginalImage(info)
      } catch (e) {
        setUiError((e as Error).message || 'Failed to load image, please retry')
      }
    },
    [setOriginalImage],
  )

  const { dropRef, isDragging } = useFileDrop(handleFiles)

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      if (event.clipboardData?.files?.length) {
        handleFiles(event.clipboardData.files)
      }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [handleFiles])

  useEffect(() => {
    if (!originalImage) return
    const timer = setTimeout(() => compress(originalImage, options), 300)
    return () => clearTimeout(timer)
  }, [compress, originalImage, options])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') reset()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [reset])

  const ratio = useMemo(() => {
    if (!originalImage || !compressedImage) return null
    const saved = originalImage.size - compressedImage.size
    const percent = (1 - compressedImage.size / originalImage.size) * 100
    return { saved, percent }
  }, [compressedImage, originalImage])

  const originalSizeText = originalImage ? formatFileSize(originalImage.size) : '--'
  const compressedSizeText = compressedImage ? formatFileSize(compressedImage.size) : '--'
  const savedSizeText = ratio ? formatFileSize(ratio.saved) : '--'
  const savedPercentText = ratio ? ratio.percent.toFixed(1) : null
  const barWidth =
    originalImage && compressedImage
      ? Math.min(100, Math.max(5, (compressedImage.size / originalImage.size) * 100))
      : 100

  const hasImage = Boolean(originalImage)

  if (!hasImage) {
    return (
      <div
        ref={dropRef}
        className={`min-h-screen text-slate-50 transition ${
          isDragging ? 'bg-slate-200/40' : ''
        }`}
      >
        {(uiError || error) && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-30 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200 shadow-lg">
            {uiError || error}
          </div>
        )}
        <div className="max-w-5xl mx-auto px-4 pt-16 pb-24 space-y-8">
          <header className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="duck-logo text-2xl">🐣</div>
              <div>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-[0.2em]">
                  圖片鴨鴨
                </p>
                <h1 className="text-4xl font-extrabold text-slate-900">可愛鴨，陪妳壓</h1>
              </div>
            </div>
            <p className="text-slate-600 max-w-2xl text-lg">
              拖放、點擊或貼上即可壓縮，全程本地、隱私安心。支援 WebP / MozJPEG / OxiPNG。
            </p>
          </header>
          <ImageUploader
            onFiles={handleFiles}
            isDragging={isDragging}
            originalImage={originalImage}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-slate-50">
      {(uiError || error) && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-30 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200 shadow-lg">
          {uiError || error}
        </div>
      )}

      <div className="fixed inset-0 z-0">
        <ImagePreview
          originalImage={originalImage}
          compressedImage={compressedImage}
          className="border border-slate-800/60"
        />
      </div>

      <div className="pointer-events-none fixed inset-0 z-20">
        <button
          type="button"
          onClick={reset}
          className="pointer-events-auto fixed top-4 left-4 text-xs px-3 py-2 rounded-full border border-slate-200 text-slate-800 hover:border-brand transition bg-white/90 shadow-lg z-30"
          aria-label="Close preview"
        >
          X
        </button>

        <button
          type="button"
          onClick={() => setIsSettingsOpen((v) => !v)}
          className="pointer-events-auto fixed top-1/2 right-2 -translate-y-1/2 z-30 bg-brand text-slate-900 text-xs px-3 py-2 rounded-full shadow-lg hover:scale-105 transition"
        >
          {isSettingsOpen ? '收合設定' : '展開設定'}
        </button>

        {isSettingsOpen && (
          <div className="pointer-events-auto fixed top-4 right-4 w-[320px] max-w-[88vw] rounded-3xl p-4 shadow-2xl bg-white/95 border border-white/70 z-20 text-slate-800">
            <CompressionSettings
              options={options}
              onChange={setOptions}
              disabled={!originalImage}
            />
          </div>
        )}

        <div className="pointer-events-auto fixed bottom-4 right-4 w-[260px] max-w-[80vw] rounded-3xl p-4 shadow-2xl bg-white text-slate-900 border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Output</p>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded-full border ${
                compressedImage
                  ? 'border-emerald-400 text-emerald-600 bg-emerald-50'
                  : 'border-slate-300 text-slate-500 bg-white/60'
              }`}
            >
              {compressedImage ? 'Compressed' : 'Pending'}
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200 p-3 text-sm text-slate-800 mb-3 space-y-2 bg-white">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Original</span>
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
                  {compressedImage ? compressedSizeText : '--'}
                </p>
                <p className="text-xs text-slate-600">Compressed size</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-emerald-600 leading-tight">
                  {savedPercentText ? `${savedPercentText}% saved` : '--'}
                </p>
                <p className="text-xs text-slate-600">Saved {compressedImage ? savedSizeText : '--'}</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Format</span>
              <span className="text-slate-800 font-semibold uppercase">
                {compressedImage ? compressedImage.format : '--'}
              </span>
            </div>
          </div>

          <DownloadButton
            compressedImage={compressedImage}
            disabled={!compressedImage || isCompressing}
            label={compressedImage ? `Download (${compressedSizeText})` : 'Download'}
          />
        </div>
      </div>
    </div>
  )
}

export default App


