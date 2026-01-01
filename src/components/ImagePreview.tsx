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
const [controlsActive, setControlsActive] = useState(true)
const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
const allowTapToggle = useRef(false)
const touchStartY = useRef<number | null>(null)
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
    const measure = () => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      setContainerSize({ width: rect.width, height: rect.height })
    }
    window.addEventListener('resize', updateMobile)
    window.addEventListener('resize', measure)
    measure()
    return () => {
      window.removeEventListener('resize', updateMobile)
      window.removeEventListener('resize', measure)
    }
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

  const letterboxMode = useMemo(() => {
    if (!originalImage || !containerSize.width || !containerSize.height) return 'none'
    const imageAspect = originalImage.width / originalImage.height
    const containerAspect = containerSize.width / containerSize.height
    if (Math.abs(imageAspect - containerAspect) < 0.02) return 'none'
    return imageAspect > containerAspect ? 'topBottom' : 'leftRight'
  }, [containerSize.height, containerSize.width, originalImage])

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

  useEffect(() => {
    if (!controlsActive) return
    const timeout = setTimeout(() => setControlsActive(false), 2000)
    return () => clearTimeout(timeout)
  }, [controlsActive])

  const mobileControlBar = (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-30 pointer-events-none w-[92vw] max-w-md flex justify-center transition-opacity"
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 16px) + 82px)',
        opacity: controlsActive ? 0.95 : 0.55,
      }}
    >
      <div className="pointer-events-auto shadow-lg border border-slate-800 bg-slate-900/85 rounded-full px-3 py-1.5 flex items-center gap-1.5 text-xs">
        <div className="flex items-center gap-1 bg-slate-800 rounded-full p-1">
          {availableModes.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                viewMode === mode ? 'bg-brand text-slate-900' : 'text-slate-200'
              }`}
            >
              {mode === 'split' ? 'Split' : 'Swipe'}
            </button>
          ))}
          {viewMode === 'swipe' && (
            <span className="px-2 py-1 rounded-full bg-emerald-500 text-slate-900 font-semibold">
              {swipeLabel}
            </span>
          )}
        </div>
        <button
          type="button"
          className="px-2 py-1 rounded bg-slate-800 text-slate-100"
          onClick={() => setZoom((z) => clampZoom(z - 0.1))}
        >
          -
        </button>
        <span className="text-brand font-semibold w-12 text-center">{(zoom * 100).toFixed(0)}%</span>
        <button
          type="button"
          className="px-2 py-1 rounded bg-slate-800 text-slate-100"
          onClick={() => setZoom((z) => clampZoom(z + 0.1))}
        >
          +
        </button>
        <button
          type="button"
          className="px-2 py-1 rounded bg-slate-800 text-slate-100"
          onClick={handleFit}
        >
          Fit
        </button>
        <button
          type="button"
          className="px-2 py-1 rounded bg-slate-800 text-slate-100"
          onClick={handleReset}
        >
          Reset
        </button>
      </div>
    </div>
  )

  const desktopControlBar = (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-30 pointer-events-none w-[92vw] max-w-4xl flex justify-center"
      style={{ bottom: '0.75rem' }}
    >
      <div className="pointer-events-auto shadow-md border border-slate-800 bg-slate-900/95 rounded-full px-2.5 py-1.5 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 bg-slate-800 rounded-full p-1">
          {availableModes.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`px-2.5 py-1 rounded-full transition text-[11px] ${
                viewMode === mode
                  ? 'bg-brand text-slate-900 font-semibold'
                  : 'text-slate-200 hover:bg-slate-700'
              }`}
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

        {viewMode === 'split' && showComparison && (
          <div className="flex items-center gap-1 bg-slate-800 rounded-full px-2 py-1">
            <button
              type="button"
              className="px-2 py-1 rounded-full text-[10px] bg-slate-700 text-slate-100 hover:bg-slate-600"
              onClick={() => adjustSplit(-10)}
            >
              More original
            </button>
            <button
              type="button"
              className="px-2 py-1 rounded-full text-[10px] bg-slate-700 text-slate-100 hover:bg-slate-600"
              onClick={() => adjustSplit(10)}
            >
              More compressed
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 text-[11px] bg-slate-800/80 rounded-full px-3 py-1">
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

        <div className="flex flex-wrap items-center gap-2 text-[11px] bg-slate-800/80 rounded-full px-3 py-1">
          <span className="text-slate-200">
            {originalImage.width}x{originalImage.height}
          </span>
          {compressedImage && (
            <span className="text-brand font-semibold">
              {formatFileSize(originalImage.size)} {'->'} {formatFileSize(compressedImage.size)}
            </span>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className={`relative rounded-2xl h-[calc(100vh-12px)] ${className}`}>
      {!isMobile && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2 bg-white/80 border border-white/70 rounded-full px-3 py-1.5 shadow-md backdrop-blur-sm">
            <div className="duck-logo w-6 h-6 p-0.5 text-[10px]">🐣</div>
            <span className="text-xs font-semibold text-slate-700">Preview</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full ${
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
      )}

      {isMobile ? mobileControlBar : desktopControlBar}
      {isMobile && originalImage && (
        <div
          className="fixed z-30 pointer-events-none transition-opacity"
          style={{
            opacity: controlsActive ? 0.95 : 0.55,
            ...(letterboxMode === 'leftRight'
              ? { right: '8px', top: '50%', transform: 'translateY(-50%)' }
              : { top: 'calc(env(safe-area-inset-top, 0px) + 8px)', right: '8px' }),
          }}
        >
          <div className="pointer-events-auto px-3 py-1.5 rounded-full bg-slate-900/85 text-white text-[11px] font-semibold shadow-lg border border-slate-800 flex items-center gap-2">
            <span>
              {originalImage.width}?{originalImage.height}
            </span>
            {compressedImage && (
              <span className="text-brand">
                {formatFileSize(originalImage.size)} ??{formatFileSize(compressedImage.size)}
              </span>
            )}
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-xl bg-slate-900/70 border border-slate-800 h-full cursor-grab"
        tabIndex={0}
        style={{ touchAction: 'none' }}
        onPointerDown={() => setControlsActive(true)}
        onPointerMove={() => setControlsActive(true)}
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
          allowTapToggle.current = false
          if (event.touches.length === 2) {
            event.preventDefault()
            handlePinchStart(event.touches as unknown as TouchList)
            return
          }
          if (viewMode === 'swipe' && event.touches.length === 1) {
            touchStartX.current = event.touches[0].clientX
            touchStartY.current = event.touches[0].clientY
            // ?芾?閫豢?賢?汗?嚗???嚗停?迂頛???
            const target = event.target as HTMLElement
            const isButton = target?.closest?.('button, a, input, select, textarea')
            allowTapToggle.current = !isButton
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
          if (viewMode !== 'swipe' || touchStartX.current === null || touchStartY.current === null)
            return
          const deltaX = event.changedTouches[0].clientX - touchStartX.current
          const deltaY = event.changedTouches[0].clientY - touchStartY.current
          const isTap = Math.abs(deltaX) < 20 && Math.abs(deltaY) < 20 && allowTapToggle.current
          if (isTap) {
            setActiveSide((prev) => (prev === 'compressed' ? 'original' : 'compressed'))
          } else if (Math.abs(deltaX) > 60) {
            setActiveSide(deltaX > 0 ? 'original' : 'compressed')
          }
          touchStartX.current = null
          touchStartY.current = null
          allowTapToggle.current = false
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
                    if (event.touches.length > 1) return
                    setIsDraggingSplit(true)
                  }}
                  className="absolute top-1/2 -translate-y-1/2 -ml-6 left-[var(--split-pos)] h-14 w-14 md:h-12 md:w-12 bg-brand text-slate-900 rounded-full shadow-lg flex items-center justify-center border border-white/60"
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
      {viewMode === 'swipe' && showComparison && (
        <div
          className={`fixed left-1/2 -translate-x-1/2 z-30 pointer-events-none`}
          style={{
            bottom: isMobile
              ? 'calc(env(safe-area-inset-bottom, 16px) + 130px)'
              : '4rem',
          }}
        >
          <span className="pointer-events-auto px-4 py-2 rounded-full bg-emerald-400 text-slate-900 text-sm font-semibold shadow-lg border border-white/70">
            Swipe or tap to switch · showing {swipeLabel}
          </span>
        </div>
      )}
    </div>
  )
}




