import { useRef } from 'react'
import { formatFileSize } from '../utils/fileUtils'
import type { ImageInfo } from '../types'

interface Props {
  onFiles: (files: FileList | File[]) => void
  isDragging: boolean
  originalImage: ImageInfo | null
}

export function ImageUploader({ onFiles, isDragging, originalImage }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  const handleBrowse = () => inputRef.current?.click()

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
          <div className="duck-logo text-2xl">🐣</div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              上傳圖片
              <span className="duck-chip text-xs">拖放 / 點擊 / 貼上</span>
            </p>
            <p className="text-sm text-slate-600 mt-1">
              支援 JPEG / PNG / WebP / GIF，單檔不超過 50MB。
            </p>
            {originalImage && (
              <p className="text-xs text-slate-500 mt-2">
                已載入：{originalImage.width} × {originalImage.height} · {formatFileSize(originalImage.size)}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleBrowse}
            className="duck-button"
            aria-label="選擇檔案"
          >
            選擇檔案
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
          />
        </div>
      </div>
    </div>
  )
}
