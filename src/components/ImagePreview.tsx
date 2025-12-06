import { useEffect, useMemo, useRef, useState } from 'react'
import type { CompressedImage, ImageInfo } from '../types'
import { formatFileSize } from '../utils/fileUtils'

type ViewMode = 'split' | 'side-by-side' | 'swipe'

interface Props {
  originalImage: ImageInfo | null
  compressedImage: CompressedImage | null
  className?: string
}

export function ImagePreview({ originalImage, compressedImage, className = '' }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [splitPosition, setSplitPosition] = useState(50)
  const [isDraggingImage, setIsDraggingImage] = useState(false)
  const [isDraggingSplit, setIsDraggingSplit] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('split')
  const [activeSide, setActiveSide] = useState<'original' | 'compressed'>('compressed')
  const dragOffset = useRef({ x: 0, y: 0 })
  const touchStartX = useRef<number | null>(null)
  const mouseSwipeStartX = useRef<number | null>(null)

  const transformStyle = useMemo(
    () => ({
      transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
    }),
    [position, zoom],
  )

  const clampZoom = (value: number) => Math.min(3, Math.max(0.5, value))

  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      if (isDraggingImage) {
        setPosition({
          x: event.clientX - dragOffset.current.x,
          y: event.clientY - dragOffset.current.y,
        })
      }
      if (isDraggingSplit && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const relative = ((event.clientX - rect.left) / rect.width) * 100
        setSplitPosition(Math.min(100, Math.max(0, relative)))
      }
    }

    const handleUp = () => {
      setIsDraggingImage(false)
      setIsDraggingSplit(false)
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [isDraggingImage, isDraggingSplit])

  useEffect(() => {
    setZoom(1)
    setPosition({ x: 0, y: 0 })
    setSplitPosition(50)
    setViewMode('split')
    setActiveSide('compressed')
  }, [originalImage?.url, compressedImage?.url])

  if (!originalImage) return null

  const showComparison = !!compressedImage
  const infoLabel = showComparison ? 'Compressed' : 'Original'

  const handleFit = () => {
    if (!containerRef.current) return
    const fit = Math.min(
      containerRef.current.clientWidth / originalImage.width,
      containerRef.current.clientHeight / originalImage.height,
    )
    setZoom(clampZoom(fit))
    setPosition({ x: 0, y: 0 })
  }

  const handleReset = () => {
    setZoom(1)
    setPosition({ x: 0, y: 0 })
    setSplitPosition(50)
  }

  const swipeLabel = activeSide === 'compressed' ? 'Compressed' : 'Original'

  return (
    <div
      className={`relative rounded-2xl h-[calc(100vh-12px)] ${className}`}
    >
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 bg-white/80 border border-white/60 rounded-full px-4 py-2 shadow-lg">
          <div className="duck-logo w-8 h-8 p-1 text-lg">🐣</div>
          <span className="text-sm font-semibold text-slate-700">圖片鴨· 可愛呀</span>
        </div>
      </div>

      {/* Bottom toolbar */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none w-[92vw] max-w-4xl flex justify-center">
        <div className="pointer-events-auto flex flex-wrap items-center gap-2 bg-slate-900/95 rounded-full px-3 py-2 shadow-lg border border-slate-800">
          <div className="flex items-center gap-1 bg-slate-800 rounded-full p-1">
            {(['split', 'side-by-side', 'swipe'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`px-2.5 py-1 rounded-full transition text-xs ${
                  viewMode === mode
                    ? 'bg-brand text-slate-900 font-semibold'
                    : 'text-slate-200 hover:bg-slate-700'
                }`}
              >
                {mode === 'split' ? '分隔線' : mode === 'side-by-side' ? '並排' : '滑動'}
              </button>
            ))}
            {viewMode === 'swipe' && (
              <button
                type="button"
                onClick={() =>
                  setActiveSide((prev) => (prev === 'compressed' ? 'original' : 'compressed'))
                }
                className="px-2.5 py-1 rounded-full text-xs bg-slate-700 text-slate-100 hover:bg-slate-600"
              >
                點擊切換
              </button>
            )}
            {viewMode === 'swipe' && (
              <span className="ml-1 px-2 py-1 rounded-full text-xs bg-emerald-500 text-slate-900 font-semibold">
                {swipeLabel}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs bg-slate-800/80 rounded-full px-3 py-1">
            <button
              type="button"
              className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-100"
              onClick={() => setZoom((z) => clampZoom(z - 0.1))}
            >
              -
            </button>
            <span className="text-brand font-semibold w-12 text-center">
              {(zoom * 100).toFixed(0)}%
            </span>
            <button
              type="button"
              className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-100"
              onClick={() => setZoom((z) => clampZoom(z + 0.1))}
            >
              +
            </button>
            <button
              type="button"
              className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-100"
              onClick={handleFit}
            >
              適合
            </button>
            <button
              type="button"
              className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-100"
              onClick={() => {
                setZoom(1)
                setPosition({ x: 0, y: 0 })
              }}
            >
              100%
            </button>
            <button
              type="button"
              className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-100"
              onClick={handleReset}
            >
              重置
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs bg-slate-800/80 rounded-full px-3 py-1">
            <span className="text-slate-200">
              {originalImage.width}×{originalImage.height}
            </span>
            {compressedImage && (
              <span className="text-brand">
                {formatFileSize(originalImage.size)} → {formatFileSize(compressedImage.size)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-xl bg-slate-900/70 border border-slate-800 h-full cursor-grab"
        tabIndex={0}
        onMouseDown={(event) => {
          if (viewMode === 'swipe') {
            mouseSwipeStartX.current = event.clientX
            setIsDraggingImage(false)
            return
          }
          if (event.button !== 0) return
          setIsDraggingImage(true)
          dragOffset.current = { x: event.clientX - position.x, y: event.clientY - position.y }
        }}
        onMouseUp={(event) => {
          if (viewMode === 'swipe' && mouseSwipeStartX.current !== null) {
            const delta = event.clientX - mouseSwipeStartX.current
            if (Math.abs(delta) > 40) {
              setActiveSide(delta > 0 ? 'original' : 'compressed')
            } else {
              setActiveSide((prev) => (prev === 'compressed' ? 'original' : 'compressed'))
            }
            mouseSwipeStartX.current = null
          }
        }}
        onWheel={(event) => {
          event.preventDefault()
          const delta = event.deltaY > 0 ? -0.1 : 0.1
          setZoom((prev) => clampZoom(prev + delta))
        }}
        onTouchStart={(event) => {
          if (viewMode === 'swipe') touchStartX.current = event.touches[0].clientX
        }}
        onTouchEnd={(event) => {
          if (viewMode !== 'swipe' || touchStartX.current === null) return
          const delta = event.changedTouches[0].clientX - touchStartX.current
          if (Math.abs(delta) > 60) {
            setActiveSide(delta > 0 ? 'original' : 'compressed')
          } else {
            setActiveSide((prev) => (prev === 'compressed' ? 'original' : 'compressed'))
          }
          touchStartX.current = null
        }}
      >
        {viewMode === 'side-by-side' && showComparison && compressedImage ? (
          <div className="absolute inset-0 flex">
            <div className="relative w-1/2 h-full overflow-hidden border-r border-slate-800">
              <img
                src={originalImage.url}
                alt="原始圖片"
                className="absolute inset-0 w-full h-full object-contain select-none"
                style={transformStyle}
                draggable={false}
              />
            </div>
            <div className="relative w-1/2 h-full overflow-hidden">
              <img
                src={compressedImage.url}
                alt="壓縮後圖片"
                className="absolute inset-0 w-full h-full object-contain select-none"
                style={transformStyle}
                draggable={false}
              />
            </div>
          </div>
        ) : viewMode === 'swipe' && showComparison && compressedImage ? (
          <img
            src={activeSide === 'compressed' ? compressedImage.url : originalImage.url}
            alt={activeSide === 'compressed' ? '壓縮後圖片' : '原始圖片'}
            className="absolute inset-0 w-full h-full object-contain select-none"
            style={transformStyle}
            draggable={false}
          />
        ) : (
          <>
            <img
              src={originalImage.url}
              alt="原始圖片"
              className="absolute inset-0 w-full h-full object-contain select-none"
              style={transformStyle}
              draggable={false}
            />
            {showComparison && compressedImage && (
              <>
                <img
                  src={compressedImage.url}
                  alt="壓縮後圖片"
                  className="absolute inset-0 w-full h-full object-contain select-none"
                  style={{
                    ...transformStyle,
                    clipPath: `inset(0 0 0 ${splitPosition}%)`,
                  }}
                  draggable={false}
                />
                <div
                  className="absolute top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-brand to-transparent shadow-lg"
                  style={{ left: `${splitPosition}%` }}
                />
                <button
                  type="button"
                  aria-label="拖曳分隔線"
                  onMouseDown={(event) => {
                    event.stopPropagation()
                    setIsDraggingSplit(true)
                  }}
                  className="absolute top-1/2 -translate-y-1/2 -ml-4 left-[var(--split-pos)] h-12 w-12 bg-brand text-slate-900 rounded-full shadow-lg flex items-center justify-center border border-white/60"
                  style={{ left: `${splitPosition}%` }}
                >
                  ⇆
                </button>
              </>
            )}
          </>
        )}
      </div>

      <div className="absolute bottom-4 left-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="px-3 py-1 rounded-full bg-slate-800/80 text-slate-200">原始</span>
        <span className="px-3 py-1 rounded-full bg-brand/20 text-brand border border-brand/30">
          {infoLabel}
        </span>
      </div>

      {viewMode === 'swipe' && showComparison && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <span className="pointer-events-auto px-4 py-2 rounded-full bg-emerald-400 text-slate-900 text-sm font-semibold shadow-lg border border-white/70">
            滑動或點擊切換 · 目前顯示 {swipeLabel}
          </span>
        </div>
      )}
    </div>
  )
}
