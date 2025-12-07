import JSZip from 'jszip'
import type { BatchItem } from '../types'
import { formatFileSize } from '../utils/fileUtils'

const formatExt: Record<string, string> = {
  webp: 'webp',
  mozjpeg: 'jpg',
  oxipng: 'png',
}

interface BatchListProps {
  items: BatchItem[]
  activeId: string | null
  onSelect: (id: string) => void
  onClear: () => void
}

const statusText: Record<BatchItem['status'], string> = {
  queued: '等待中',
  processing: '壓縮中',
  done: '完成',
  error: '失敗',
}

export function BatchList({ items, activeId, onSelect, onClear }: BatchListProps) {
  const doneItems = items.filter((item) => item.status === 'done' && item.compressed)
  const totalSaved = doneItems.reduce(
    (acc, item) => acc + (item.info.size - (item.compressed?.size ?? 0)),
    0,
  )

  const downloadItem = (item: BatchItem) => {
    if (!item.compressed) return
    const ext = formatExt[item.compressed.format]
    const nameWithoutExt = item.info.file.name.replace(/\.[^.]+$/, '')
    const link = document.createElement('a')
    link.href = item.compressed.url
    link.download = `${nameWithoutExt}_compressed.${ext}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const downloadAll = async () => {
    if (!doneItems.length) return
    const zip = new JSZip()
    doneItems.forEach((item, index) => {
      const ext = formatExt[item.compressed!.format]
      const baseName = item.info.file.name.replace(/\.[^.]+$/, '')
      const name = baseName ? `${baseName}.${ext}` : `image-${index + 1}.${ext}`
      zip.file(name, item.compressed!.blob)
    })
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'imgduck-batch.zip'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="pointer-events-auto fixed top-4 right-4 w-[360px] max-w-[90vw] rounded-3xl p-4 shadow-2xl bg-white text-slate-900 border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-lg font-semibold">批次清單</p>
          <p className="text-xs text-slate-500">
            {items.length} 張 · 已完成 {doneItems.length} 張 · 節省 {formatFileSize(totalSaved)}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClear}
            className="text-xs px-3 py-1 rounded-full border border-slate-200 text-slate-600 hover:border-brand"
          >
            清空
          </button>
          <button
            type="button"
            disabled={!doneItems.length}
            onClick={downloadAll}
            className="text-xs px-3 py-1 rounded-full bg-brand text-slate-900 font-semibold disabled:opacity-50"
          >
            全部 ZIP
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`w-full text-left rounded-2xl border p-3 transition ${
              item.id === activeId ? 'border-brand bg-brand/10' : 'border-slate-200 bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold truncate">{item.info.file.name}</p>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  item.status === 'done'
                    ? 'bg-emerald-100 text-emerald-700'
                    : item.status === 'processing'
                      ? 'bg-amber-100 text-amber-700'
                      : item.status === 'error'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-slate-100 text-slate-600'
                }`}
              >
                {statusText[item.status]}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
              <span>{formatFileSize(item.info.size)}</span>
              {item.compressed ? (
                <button
                  type="button"
                  className="text-brand font-semibold"
                  onClick={(e) => {
                    e.stopPropagation()
                    downloadItem(item)
                  }}
                >
                  下載
                </button>
              ) : item.status === 'error' ? (
                <span className="text-red-500">{item.error ?? '壓縮失敗'}</span>
              ) : (
                <span>{item.status === 'processing' ? '壓縮中...' : '等待壓縮'}</span>
              )}
            </div>
          </button>
        ))}
        {!items.length && (
          <p className="text-center text-sm text-slate-500 py-6">尚未加入任何檔案</p>
        )}
      </div>
    </div>
  )
}
