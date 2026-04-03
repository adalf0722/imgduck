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
    <div
      className={`pointer-events-auto fixed top-5 right-5 ${
        isSingleDone ? 'w-[280px]' : 'w-[360px]'
      } workspace-panel max-w-[90vw] text-slate-900`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Queue</p>
          <p className="mt-2 text-xl font-black tracking-tight text-slate-950">Batch queue</p>
          <p className="mt-1 text-[11px] text-slate-500">
            {items.length} files, {doneItems.length} done, saved {formatFileSize(totalSaved)}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClear}
            className="rounded-full border border-white/80 bg-white/65 px-3 py-1.5 text-[11px] text-slate-600 hover:border-brand"
          >
            Clear
          </button>
          <button
            type="button"
            disabled={!allDone}
            onClick={downloadAll}
            className="rounded-full bg-brand px-3 py-1.5 text-[11px] font-semibold text-slate-900 disabled:opacity-50"
          >
            {zipLabel}
          </button>
        </div>
      </div>

      {isSingleDone && (
        <div className="rounded-2xl border border-white/80 bg-white/70 px-3 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="truncate text-sm font-semibold">{items[0].info.file.name}</p>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] text-emerald-700">
              Done
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">1 item, ready to download</p>
        </div>
      )}

      {!isSingleDone && (
        <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
          {items.map((item) => {
            const compressedSizeText = item.compressed ? formatFileSize(item.compressed.size) : null
            const isActive = item.id === activeId
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className={`relative w-full rounded-[1.6rem] border p-4 text-left transition ${
                  isActive
                    ? 'border-brand/70 bg-gradient-to-r from-white to-brand/20 shadow-md'
                    : 'border-white/80 bg-white/62 hover:bg-white/75'
                }`}
              >
                {isActive && (
                  <span className="absolute bottom-3 left-0 top-3 w-1 rounded-full bg-brand" />
                )}
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate pr-3 text-sm font-semibold leading-6">{item.info.file.name}</p>
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
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
                <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                  <span>{formatFileSize(item.info.size)}</span>
                  {item.compressed ? (
                    <button
                      type="button"
                      className="duck-button bg-brand px-3 py-1 text-xs font-semibold text-slate-900 disabled:opacity-60"
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
            <p className="py-6 text-center text-sm text-slate-500">No files in the queue yet</p>
          )}
        </div>
      )}
    </div>
  )
}
