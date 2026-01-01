import Cropper, { type Area } from 'react-easy-crop'

export interface CropRatioOption {
  key: string
  label: string
  value: number
}

interface Props {
  open: boolean
  imageUrl: string
  crop: { x: number; y: number }
  zoom: number
  aspect: number
  ratioOptions: CropRatioOption[]
  selectedRatio: string
  onRatioChange: (key: string) => void
  onCropChange: (crop: { x: number; y: number }) => void
  onZoomChange: (zoom: number) => void
  onCropComplete: (area: Area, areaPixels: Area) => void
  onClose: () => void
  onApply: () => void
  onReset: () => void
  resetDisabled?: boolean
  applyDisabled?: boolean
}

export function CropModal({
  open,
  imageUrl,
  crop,
  zoom,
  aspect,
  ratioOptions,
  selectedRatio,
  onRatioChange,
  onCropChange,
  onZoomChange,
  onCropComplete,
  onClose,
  onApply,
  onReset,
  resetDisabled,
  applyDisabled,
}: Props) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="p-5 flex items-center justify-between border-b border-slate-200">
          <div>
            <p className="text-lg font-semibold text-slate-900">Crop image</p>
            <p className="text-xs text-slate-500">Fixed ratios with zoom control.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-600 px-3 py-1 rounded-full bg-slate-100"
          >
            Close
          </button>
        </div>

        <div className="relative w-full h-[50vh] bg-slate-100">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="p-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            {ratioOptions.map((option) => {
              const active = option.key === selectedRatio
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => onRatioChange(option.key)}
                  className={`text-xs font-semibold px-3 py-1 rounded-full border transition ${
                    active
                      ? 'border-brand bg-brand/30 text-slate-900'
                      : 'border-slate-200 text-slate-600 hover:border-brand/60'
                  }`}
                >
                  {option.label}
                </button>
              )
            })}
          </div>

          <div>
            <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
              <span>Zoom</span>
              <span className="text-slate-900 font-semibold">{zoom.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(event) => onZoomChange(Number(event.target.value))}
              className="w-full accent-brand"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onReset}
              disabled={resetDisabled}
              className="text-xs px-3 py-2 rounded-full border border-slate-200 text-slate-600 hover:border-brand disabled:opacity-50"
            >
              Reset crop
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="text-xs px-3 py-2 rounded-full border border-slate-200 text-slate-600 hover:border-brand"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onApply}
                disabled={applyDisabled}
                className="duck-button text-xs px-4 py-2 disabled:opacity-50"
              >
                Apply crop
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
