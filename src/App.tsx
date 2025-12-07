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
                  圖片鴨鴨
                </p>
                <h1 className="text-4xl font-extrabold text-slate-900">可愛鴨，陪妳壓</h1>
              </div>
            </div>
            <p className="text-slate-600 text-lg md:text-xl max-w-5xl leading-relaxed">
              拖放、貼上或直接選整個資料夾即可壓縮，全程本地、隱私安心。{' '}
              <span className="whitespace-nowrap">支援 WebP · MozJPEG · OxiPNG</span>
              <span className="md:whitespace-nowrap">，並會自動排入批次佇列。</span>
            </p>
            <div className="grid gap-3 md:grid-cols-3 text-slate-700">
              <div className="glass-card rounded-2xl px-4 py-3">
                <p className="font-semibold text-slate-900">批次佇列</p>
                <p className="text-sm">一次匯入多張或整個資料夾，逐張壓縮並顯示進度。</p>
              </div>
              <div className="glass-card rounded-2xl px-4 py-3">
                <p className="font-semibold text-slate-900">比較工具</p>
                <p className="text-sm">分隔線 / 並排 / 滑動三種模式，搭配同步縮放與滑鼠滾輪。</p>
              </div>
              <div className="glass-card rounded-2xl px-4 py-3">
                <p className="font-semibold text-slate-900">ZIP 打包</p>
                <p className="text-sm">完成後可單檔下載，或將整批圖檔一鍵匯出為 ZIP。</p>
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
            {isSettingsOpen ? '收合設定' : '展開設定'}
          </button>

          <div className="rounded-3xl p-4 shadow-2xl bg-white text-slate-900 border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">輸出結果</p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full border ${
                  activeCompressed && activeStatus === 'done'
                    ? 'border-emerald-400 text-emerald-600 bg-emerald-50'
                    : 'border-slate-300 text-slate-500 bg-white/60'
                }`}
              >
                {activeCompressed && activeStatus === 'done' ? '已壓縮' : '處理中'}
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200 p-3 text-sm text-slate-800 mb-3 space-y-2 bg-white">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>原始大小</span>
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
                  <p className="text-xs text-slate-600">壓縮後大小</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-emerald-600 leading-tight">
                    {savedPercentText ? `${savedPercentText}% 節省` : '--'}
                  </p>
                  <p className="text-xs text-slate-600">節省 {activeCompressed ? savedSizeText : '--'}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>輸出格式</span>
                <span className="text-slate-800 font-semibold uppercase">
                  {activeCompressed ? activeCompressed.format : '--'}
                </span>
              </div>
            </div>

            <DownloadButton
              compressedImage={activeCompressed}
              disabled={!activeCompressed || activeStatus !== 'done'}
              label={activeCompressed ? `下載（${compressedSizeText}）` : '下載'}
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


