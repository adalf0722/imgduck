import type { CompressedImage } from '../types'

interface Props {
  compressedImage: CompressedImage | null
  originalName?: string
  disabled?: boolean
  label?: string
}

const EXT_MAP: Record<CompressedImage['format'], string> = {
  webp: 'webp',
  mozjpeg: 'jpg',
  oxipng: 'png',
}

export function DownloadButton({ compressedImage, originalName, disabled, label }: Props) {
  const handleDownload = () => {
    if (!compressedImage) return
    const ext = EXT_MAP[compressedImage.format]
    const base =
      originalName?.replace(/\.[^.]+$/, '')?.trim() ||
      'compressed'
    const link = document.createElement('a')
    link.href = compressedImage.url
    link.download = `${base}_compressed.${ext}`
    link.click()
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={!compressedImage || disabled}
      className="duck-button w-full justify-center flex items-center gap-2 text-sm py-3"
    >
      {label ?? 'Download'}
    </button>
  )
}
