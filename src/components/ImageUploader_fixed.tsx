import { useRef } from 'react'

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
      className={`glass-card border-2 border-transparent rounded-3xl p-6 transition ${
        isDragging ? 'border-brand shadow-lg shadow-brand/30' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="duck-logo text-2xl">?£</div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              Upload images / folders
              <span className="duck-chip text-xs">Drag / click / paste</span>
            </p>
            <p className="text-sm text-slate-600 mt-1">
              Supports JPEG / PNG / WebP / GIF up to 50MB each.{' '}
              <span className="font-semibold text-slate-900">{count}</span> file(s) queued.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleFileClick}
            className="duck-button"
            aria-label="Select files"
          >
            Select files
          </button>
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
      <p className="text-sm text-slate-600 mt-3">?–æ?è³‡æ?å¤¾å¯?¯å…¥?´æ‰¹</p>
    </div>
  )
}
