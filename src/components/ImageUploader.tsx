import { useRef } from 'react'
import { BrandMark } from './BrandMark'

interface Props {
  onFiles: (files: FileList | File[]) => void
  isDragging: boolean
  count?: number
}

export function ImageUploader({ onFiles, isDragging, count = 0 }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFileClick = () => fileInputRef.current?.click()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      onFiles(event.target.files)
      event.target.value = ''
    }
  }

  return (
    <div
      className={`glass-card duck-panel rounded-[2rem] p-6 md:p-7 transition-all ${
        isDragging ? 'border-brand shadow-[0_24px_80px_rgba(245,158,11,0.28)] -translate-y-1' : ''
      }`}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <BrandMark className="h-14 w-14 shrink-0" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-2xl font-black tracking-tight text-slate-950">Upload images</p>
              <span className="duck-chip text-xs">Drag / click / paste</span>
              <span className="duck-chip text-xs">Folders supported</span>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Supports JPEG, PNG, WebP and GIF up to 50MB each. Compression stays local, so
              originals never leave your device.
            </p>
            <p className="mt-3 text-sm text-slate-500">
              Queue status: <span className="font-semibold text-slate-900">{count}</span> file(s)
              ready.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handleFileClick}
            className="duck-button min-w-[160px]"
            aria-label="Select files"
          >
            Select files
          </button>
          <p className="text-xs leading-5 text-slate-500 sm:max-w-[11rem]">
            Tip: paste screenshots directly into the page.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>
    </div>
  )
}
