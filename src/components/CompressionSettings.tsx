import type { CompressionOptions, CompressionFormat } from '../types'

interface Props {
  options: CompressionOptions
  onChange: (options: CompressionOptions) => void
  disabled?: boolean
}

const formats: { value: CompressionFormat; label: string; hint: string }[] = [
  { value: 'webp', label: 'WebP', hint: 'Lossy / lossless, well-balanced' },
  { value: 'mozjpeg', label: 'MozJPEG', hint: 'Lossy, web-friendly JPEG' },
  { value: 'oxipng', label: 'OxiPNG', hint: 'Lossless, great for PNG' },
]

export function CompressionSettings({ options, onChange, disabled }: Props) {
  const handleFormat = (format: CompressionFormat) => onChange({ ...options, format })

  const handleQuality = (value: number) => onChange({ ...options, quality: value })

  const handleDimension = (key: 'maxWidth' | 'maxHeight', value: string) => {
    if (value === '') {
      onChange({ ...options, [key]: undefined })
      return
    }
    const numeric = Number(value)
    onChange({ ...options, [key]: Number.isNaN(numeric) ? undefined : numeric })
  }

  return (
    <div className="workspace-panel animate-fade-in space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
            Compression
          </p>
          <p className="mt-1.5 text-lg font-black tracking-tight text-slate-950">
            Output profile
          </p>
        </div>
        <span className="rounded-full border border-white/80 bg-white/70 px-3 py-1 text-xs text-slate-700 shadow-sm">
          Auto preview (~300ms)
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        {formats.map((format) => (
          <button
            key={format.value}
            type="button"
            disabled={disabled}
            onClick={() => handleFormat(format.value)}
            className={`relative w-full rounded-[1.35rem] border p-2.5 text-left transition ${
              options.format === format.value
                ? 'compression-option-active border-brand/70 bg-gradient-to-br from-brand/35 to-white text-slate-950 shadow-md'
                : 'border-white/80 bg-white/55 text-slate-700 hover:border-brand/60 hover:bg-white/75'
            } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {options.format === format.value && (
              <span className="absolute inset-y-2 left-0 w-1 rounded-full bg-brand shadow-[0_0_20px_rgba(245,158,11,0.45)]" />
            )}
            <p className="font-bold">{format.label}</p>
            <p
              className={`mt-1 text-[11px] leading-5 ${
                options.format === format.value ? 'text-slate-700' : 'text-slate-500'
              }`}
            >
              {format.hint}
            </p>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <div className="rounded-[1.35rem] border border-white/75 bg-white/60 p-2.5">
          <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
            <span>Quality</span>
            <span className="rounded-full bg-slate-950 px-2.5 py-1 text-xs font-bold text-white">
              {options.quality}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={options.quality}
            disabled={disabled}
            onChange={(e) => handleQuality(Number(e.target.value))}
            className="workspace-range w-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="mb-1 block text-xs text-slate-600">Max width (px)</label>
            <input
              type="number"
              min={1}
              value={options.maxWidth ?? ''}
              disabled={disabled}
              onChange={(e) => handleDimension('maxWidth', e.target.value)}
              placeholder="Original width"
              className="workspace-input w-full"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-600">Max height (px)</label>
            <input
              type="number"
              min={1}
              value={options.maxHeight ?? ''}
              disabled={disabled}
              onChange={(e) => handleDimension('maxHeight', e.target.value)}
              placeholder="Original height"
              className="workspace-input w-full"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
