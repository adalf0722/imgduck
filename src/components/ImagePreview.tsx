import { useEffect, useMemo, useRef, useState } from 'react'
import type { BatchStatus, CompressedImage, ImageInfo } from '../types'
import { formatFileSize } from '../utils/fileUtils'

type ViewMode = 'split' | 'side-by-side' | 'swipe'

interface Props {
  originalImage: ImageInfo | null
  compressedImage: CompressedImage | null
  status?: BatchStatus
  className?: string
}

export function ImagePreview({
  originalImage,
  compressedImage,
  status = 'queued',
  className = '',
}: Props) {
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
  const pinchData = useRef<{ distance: number; zoom: number } | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  const transformStyle = useMemo(
    () => ({
      transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
    }),
    [position, zoom],
  )

  const clampZoom = (value: number) => Math.min(3, Math.max(0.5, value))

  useEffect(() => {
    const updateMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    updateMobile()
    window.addEventListener('resize', updateMobile)
    return () => window.removeEventListener('resize', updateMobile)
  }, [])

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

    const handleTouchMove = (event: TouchEvent) => {
      if (isDraggingSplit && containerRef.current) {
        const touch = event.touches[0]
        if (!touch) return
        const rect = containerRef.current.getBoundingClientRect()
        const relative = ((touch.clientX - rect.left) / rect.width) * 100
        setSplitPosition(Math.min(100, Math.max(0, relative)))
      }
    }

    const handleUp = () => {
      setIsDraggingImage(false)
      setIsDraggingSplit(false)
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    window.addEventListener('touchmove', handleTouchMove)
    window.addEventListener('touchend', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleUp)
    }
  }, [isDraggingImage, isDraggingSplit])

  useEffect(() => {
    setZoom(1)
    setPosition({ x: 0, y: 0 })
    setSplitPosition(50)
    setViewMode('split')
    setActiveSide('compressed')
  }, [originalImage?.url, compressedImage?.url])

  useEffect(() => {
    if (isMobile && viewMode === 'side-by-side') {
      setViewMode('split')
    }
  }, [isMobile, viewMode])

  const availableModes: ViewMode[] = isMobile ? ['split', 'swipe'] : ['split', 'side-by-side', 'swipe']

  const adjustSplit = (delta: number) => {
    setSplitPosition((prev) => Math.min(100, Math.max(0, prev + delta)))
  }

  const handlePinchStart = (touches: TouchList) => {
    if (touches.length < 2) return
    const distance = Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY,
    )
    pinchData.current = { distance, zoom }
  }

  const handlePinchMove = (touches: TouchList) => {
    if (touches.length < 2 || !pinchData.current) return
    const distance = Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY,
    )
    const scale = distance / pinchData.current.distance
    setZoom(clampZoom(pinchData.current.zoom * scale))
  }

  const handlePinchEnd = () => {
    pinchData.current = null
  }

  if (!originalImage) {
    return (
      <div className={`rounded-2xl h-[calc(100vh-12px)] flex items-center justify-center ${className}`}>
        <p className="text-slate-500">Select an image to preview</p>
      </div>
    )
  }

  const showComparison = !!compressedImage
  const swipeLabel = activeSide === 'compressed' ? 'Compressed' : 'Original'

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

  return (
    <div className={`relative rounded-2xl h-[calc(100vh-12px)] ${className}`}>
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 bg-white/90 border border-white/60 rounded-full px-4 py-2 shadow-lg">
          <div className="duck-logo w-8 h-8 p-1 text-lg">🐣</div>
          <span className="text-sm font-semibold text-slate-700">Imgduck · preview</span>
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              status === 'done'
                ? 'bg-emerald-100 text-emerald-700'
                : status === 'processing'
                  ? 'bg-amber-100 text-amber-700'
                  : status === 'error'
                    ? 'bg-red-100 text-red-600'
                    : 'bg-slate-100 text-slate-600'
            }`}
          >
            {status === 'done'
              ? 'Done'
              : status === 'processing'
                ? 'Compressing'
                : status === 'error'
                  ? 'Failed'
                  : 'Queued'}
          </span>
        </div>
      </div>


      <div
        className={`fixed ${isMobile ? 'bottom-24' : 'bottom-4'} left-1/2 -translate-x-1/2 z-30 pointer-events-none w-[92vw] ${
          isMobile ? 'max-w-md' : 'max-w-4xl'
        } flex justify-center`}
      >
        <div
          className={`pointer-events-auto shadow-lg border border-slate-800 bg-slate-900/95 ${
            isMobile
              ? 'rounded-3xl px-4 py-3 flex flex-col gap-3 w-full'
              : 'rounded-full px-3 py-2 flex flex-wrap items-center gap-2'
          }`}
        >
          <div
            className={`flex items-center gap-1 bg-slate-800 rounded-full p-1 ${
              isMobile ? 'justify-between' : ''
            }`}
          >
            {availableModes.map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`rounded-full transition text-xs font-semibold ${
                  viewMode === mode
                    ? 'bg-brand text-slate-900'
                    : 'text-slate-200 hover:bg-slate-700'
                } ${isMobile ? 'px-3 py-1.5' : 'px-2.5 py-1'}`}
              >
                {mode === 'split' ? 'Split' : mode === 'side-by-side' ? 'Side-by-side' : 'Swipe'}
              </button>
            ))}
            {viewMode === 'swipe' && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setActiveSide((prev) => (prev === 'compressed' ? 'original' : 'compressed'))
                  }
                  className="px-2.5 py-1 rounded-full text-xs bg-slate-700 text-slate-100 hover:bg-slate-600"
                >
                  Tap to toggle
                </button>
                <span className="ml-1 px-2 py-1 rounded-full text-xs bg-emerald-500 text-slate-900 font-semibold">
                  {swipeLabel}
                </span>
              </>
            )}
          </div>

          <div
            className={`flex items-center gap-2 text-xs bg-slate-800/80 rounded-full px-3 py-1 ${
              isMobile ? 'justify-between w-full' : ''
            }`}
          >
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
              Fit
            </button>
            <button
              type="button"
              className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-100"
              onClick={handleReset}
            >
              Reset
            </button>
          </div>

          <div
            className={`flex flex-wrap items-center gap-2 text-xs bg-slate-800/80 rounded-full px-3 py-1 ${
              isMobile ? 'justify-between w-full' : ''
            }`}
          >
            <span className="text-slate-200">
              {originalImage.width}×{originalImage.height}
            </span>
            {compressedImage && (
              <span className="text-brand font-semibold">
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
          if (event.touches.length === 2) {
            handlePinchStart(event.touches as unknown as TouchList)
            return
          }
          if (viewMode === 'swipe' && event.touches.length === 1) {
            touchStartX.current = event.touches[0].clientX
          }
        }}
        onTouchMove={(event) => {
          if (event.touches.length === 2) {
            event.preventDefault()
            handlePinchMove(event.touches as unknown as TouchList)
          }
        }}
        onTouchEnd={(event) => {
          if (event.touches.length < 2) {
            handlePinchEnd()
          }
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
                alt="Original image"
                className="absolute inset-0 w-full h-full object-contain select-none"
                style={transformStyle}
                draggable={false}
              />
            </div>
            <div className="relative w-1/2 h-full overflow-hidden">
              <img
                src={compressedImage.url}
                alt="Compressed image"
                className="absolute inset-0 w-full h-full object-contain select-none"
                style={transformStyle}
                draggable={false}
              />
            </div>
          </div>
        ) : viewMode === 'swipe' && showComparison && compressedImage ? (
          <img
            src={activeSide === 'compressed' ? compressedImage.url : originalImage.url}
            alt={activeSide === 'compressed' ? 'Compressed image' : 'Original image'}
            className="absolute inset-0 w-full h-full object-contain select-none"
            style={transformStyle}
            draggable={false}
          />
        ) : (
          <>
            <img
              src={originalImage.url}
              alt="Original image"
              className="absolute inset-0 w-full h-full object-contain select-none"
              style={transformStyle}
              draggable={false}
            />
            {showComparison && compressedImage && (
              <>
                <img
                  src={compressedImage.url}
                alt="Compressed image"
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
                  aria-label="Drag the divider"
                  onMouseDown={(event) => {
                    event.stopPropagation()
                    setIsDraggingSplit(true)
                  }}
                  onTouchStart={(event) => {
                    event.stopPropagation()
                    setIsDraggingSplit(true)
                  }}
                  className="absolute top-1/2 -translate-y-1/2 -ml-6 left-[var(--split-pos)] h-16 w-16 md:h-12 md:w-12 bg-brand text-slate-900 rounded-full shadow-lg flex items-center justify-center border border-white/60"
                  style={{ left: `${splitPosition}%` }}
                >
                  <svg
                    className="w-8 h-8 md:w-6 md:h-6 text-slate-900"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M8 5 3 12l5 7" />
                    <path d="M16 5l5 7-5 7" />
                    <path d="M3 12h18" />
                  </svg>
                </button>
              </>
            )}
          </>
        )}
      </div>


      {isMobile && viewMode === 'split' && showComparison && (
        <div
          className={`fixed ${isMobile ? 'bottom-44' : 'bottom-28'} left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex gap-3 ${
            isMobile ? 'w-[90vw] max-w-sm flex-col' : ''
          }`}
        >
          <button
            type="button"
            className="bg-slate-900/80 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg"
            onClick={() => adjustSplit(-10)}
          >
            More original
          </button>
          <button
            type="button"
            className="bg-slate-900/80 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg"
            onClick={() => adjustSplit(10)}
          >
            More compressed
          </button>
        </div>
      )}


      {viewMode === 'swipe' && showComparison && (
        <div
          className={`fixed ${isMobile ? 'bottom-36' : 'bottom-16'} left-1/2 -translate-x-1/2 z-30 pointer-events-none`}
        >
          <span className="pointer-events-auto px-4 py-2 rounded-full bg-emerald-400 text-slate-900 text-sm font-semibold shadow-lg border border-white/70">
            Swipe or tap to switch · showing {swipeLabel}
          </span>
        </div>
      )}
    </div>
  )
}
