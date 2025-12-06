import type { CompressionOptions, CompressionFormat } from '../types'

interface Props {
  options: CompressionOptions
  onChange: (options: CompressionOptions) => void
  disabled?: boolean
}

const formats: { value: CompressionFormat; label: string; hint: string }[] = [
  { value: 'webp', label: 'WebP', hint: '有損/無損，通用高效' },
  { value: 'mozjpeg', label: 'MozJPEG', hint: '有損，網頁友善 JPEG' },
  { value: 'oxipng', label: 'OxiPNG', hint: '無損，針對 PNG 圖' },
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
    <div className="rounded-3xl p-5 shadow-2xl bg-white text-slate-900 border border-slate-200 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-lg font-extrabold text-slate-900">壓縮設定</p>
        </div>
        <span className="text-xs text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
          約 300ms 內應變
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {formats.map((format) => (
          <button
            key={format.value}
            type="button"
            disabled={disabled}
            onClick={() => handleFormat(format.value)}
            className={`w-full text-left p-3 rounded-xl border transition ${
              options.format === format.value
                ? 'border-brand bg-brand/25 text-slate-900 shadow-md'
                : 'border-slate-200 text-slate-700 hover:border-brand/60'
            } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <p className="font-semibold">{format.label}</p>
            <p className="text-xs text-slate-500">{format.hint}</p>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-sm text-slate-600 mb-1">
            <span>品質</span>
            <span className="text-slate-900 font-semibold">{options.quality}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={options.quality}
            disabled={disabled}
            onChange={(e) => handleQuality(Number(e.target.value))}
            className="w-full accent-brand"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-slate-600 block mb-1">最大寬度 (px)</label>
            <input
              type="number"
              min={1}
              value={options.maxWidth ?? ''}
              disabled={disabled}
              onChange={(e) => handleDimension('maxWidth', e.target.value)}
              placeholder="原始寬度"
              className="w-full rounded-xl bg-slate-50 border border-slate-200 text-slate-800 px-3 py-2 focus:outline-none focus:border-brand"
            />
          </div>
          <div>
            <label className="text-sm text-slate-600 block mb-1">最大高度 (px)</label>
            <input
              type="number"
              min={1}
              value={options.maxHeight ?? ''}
              disabled={disabled}
              onChange={(e) => handleDimension('maxHeight', e.target.value)}
              placeholder="原始高度"
              className="w-full rounded-xl bg-slate-50 border border-slate-200 text-slate-800 px-3 py-2 focus:outline-none focus:border-brand"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
