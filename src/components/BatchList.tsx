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
  queued: 'Queued',
  processing: 'Compressing',
  done: 'Done',
  error: 'Failed',
}

const buildTimestampedName = () => {
  const d = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

export function BatchList({ items, activeId, onSelect, onClear }: BatchListProps) {
  const doneItems = items.filter((item) => item.status === 'done' && item.compressed)
  const totalCount = items.length
  const doneCount = doneItems.length
  const allDone = totalCount > 0 && doneCount === totalCount
  const zipLabel = totalCount > 0 ? `ZIP all (${doneCount}/${totalCount})` : 'ZIP all'
  const totalSaved = doneItems.reduce(
    (acc, item) => acc + (item.info.size - (item.compressed?.size ?? 0)),
    0,
  )
  const isSingleDone = totalCount === 1 && doneCount === 1

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
    link.download = `imgduck-${buildTimestampedName()}.zip`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className={`pointer-events-auto fixed top-4 right-4 ${isSingleDone ? 'w-[280px]' : 'w-[360px]'} max-w-[90vw] rounded-3xl p-4 shadow-xl bg-white/90 text-slate-900 border border-slate-200/70 backdrop-blur-sm`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-base font-semibold">Batch queue</p>
          <p className="text-[11px] text-slate-500">
            {items.length} files · {doneItems.length} done · saved {formatFileSize(totalSaved)}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClear}
            className="text-[11px] px-2.5 py-1 rounded-full border border-slate-200 text-slate-600 hover:border-brand"
          >
            Clear
          </button>
          <button
            type="button"
            disabled={!allDone}
            onClick={downloadAll}
            className="text-[11px] px-2.5 py-1 rounded-full bg-brand text-slate-900 font-semibold disabled:opacity-50"
          >
            {zipLabel}
          </button>
        </div>
      </div>

      {isSingleDone && (
        <div className="rounded-2xl border border-slate-200/70 bg-white/90 px-3 py-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold truncate">{items[0].info.file.name}</p>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
              Done
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">1 item · Done</p>
        </div>
      )}

      {!isSingleDone && (
      <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
        {items.map((item) => {
          const compressedSizeText = item.compressed ? formatFileSize(item.compressed.size) : null
          const isActive = item.id === activeId
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`w-full text-left rounded-2xl border p-3 transition relative ${
                isActive
                  ? 'border-brand bg-brand/15 shadow-md'
                  : 'border-slate-200 bg-slate-50 opacity-90'
              }`}
            >
              {isActive && <span className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-brand" />}
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
                    className="duck-button text-xs px-3 py-1 bg-brand text-slate-900 font-semibold disabled:opacity-60"
                    onClick={(e) => {
                      e.stopPropagation()
                      downloadItem(item)
                    }}
                  >
                    {compressedSizeText ? `Download (${compressedSizeText})` : 'Download'}
                  </button>
                ) : item.status === 'error' ? (
                  <span className="text-red-500">{item.error ?? 'Compression failed'}</span>
                ) : (
                  <span>{item.status === 'processing' ? 'Compressing…' : 'Waiting'}</span>
                )}
              </div>
            </button>
          )
        })}
        {!items.length && (
          <p className="text-center text-sm text-slate-500 py-6">No files in the queue yet</p>
        )}
      </div>
      )}
    </div>
  )
}
