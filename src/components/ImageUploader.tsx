import { useRef } from 'react'

interface Props {
  onFiles: (files: FileList | File[]) => void
  onFolderSelect?: (files: FileList) => void
  isDragging: boolean
  count?: number
}

export function ImageUploader({ onFiles, onFolderSelect, isDragging, count = 0 }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const folderInputRef = useRef<HTMLInputElement | null>(null)

  const handleFileClick = () => fileInputRef.current?.click()
  const handleFolderClick = () => folderInputRef.current?.click()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      onFiles(event.target.files)
      event.target.value = ''
    }
  }

  const handleFolderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && onFolderSelect) {
      onFolderSelect(event.target.files)
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
              上傳圖片 / 資料夾
              <span className="duck-chip text-xs">拖放 / 點擊 / 貼上</span>
            </p>
            <p className="text-sm text-slate-600 mt-1">
              支援 JPEG / PNG / WebP / GIF，單檔不超過 50MB。已加入{' '}
              <span className="font-semibold text-slate-900">{count}</span> 張圖片。
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleFileClick}
            className="duck-button"
            aria-label="選擇檔案"
          >
            選擇檔案
          </button>
          <button
            type="button"
            onClick={handleFolderClick}
            className="duck-button bg-accent"
            aria-label="選擇資料夾"
          >
            選擇資料夾
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          <input
            ref={folderInputRef}
            type="file"
            multiple
            //@ts-ignore
            webkitdirectory="true"
            onChange={handleFolderChange}
            className="hidden"
          />
        </div>
      </div>
    </div>
  )
}
