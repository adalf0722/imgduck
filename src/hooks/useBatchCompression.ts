import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { BatchItem, CompressionOptions } from '../types'
import { compressImage } from '../utils/compression'
import { getImageInfo, validateImageFile } from '../utils/fileUtils'

interface EnqueueResult {
  added: number
  errors: string[]
}

const createId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`

const scheduleIdle = (callback: () => void) => {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    ;(window as typeof window & { requestIdleCallback(cb: () => void): void }).requestIdleCallback(
      callback,
    )
  } else {
    setTimeout(callback, 0)
  }
}

const revokeItemUrls = (item: BatchItem) => {
  if (item.info?.url) URL.revokeObjectURL(item.info.url)
  if (item.compressed?.url) URL.revokeObjectURL(item.compressed.url)
}

export function useBatchCompression(options: CompressionOptions) {
  const [items, setItems] = useState<BatchItem[]>([])
  const [activeIdState, setActiveIdState] = useState<string | null>(null)
  const itemsRef = useRef<BatchItem[]>([])
  const optionsRef = useRef(options)
  const activeIdRef = useRef<string | null>(null)
  const processingRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)

  const setActiveId = useCallback((id: string | null) => {
    activeIdRef.current = id
    setActiveIdState(id)
  }, [])

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    optionsRef.current = options
  }, [options])

  useEffect(() => {
    if (!itemsRef.current.length) return
    abortRef.current?.abort()
    setItems((prev) =>
      prev.map((item) => {
        revokeItemUrls(item)
        return {
          ...item,
          status: 'queued',
          compressed: null,
          error: null,
        }
      }),
    )
  }, [options])

  const enqueueFiles = useCallback(
    async (fileList: FileList | File[]): Promise<EnqueueResult> => {
      const files = Array.from(fileList)
      const created: BatchItem[] = []
      const errors: string[] = []

      for (const file of files) {
        const validation = validateImageFile(file)
        if (!validation.valid) {
          errors.push(validation.error ?? 'This file cannot be compressed')
          continue
        }

        try {
          const info = await getImageInfo(file)
          created.push({
            id: createId(),
            info,
            status: 'queued',
            compressed: null,
            error: null,
          })
        } catch (error) {
          errors.push((error as Error).message || 'Failed to load image')
        }
      }

      if (created.length) {
        setItems((prev) => {
          const merged = [...prev, ...created]
          if (!activeIdRef.current && merged.length) {
            setActiveId(merged[0].id)
          }
          return merged
        })
      }

      return { added: created.length, errors }
    },
    [setActiveId],
  )

  const processQueue = useCallback(() => {
    if (processingRef.current) return
    const next = itemsRef.current.find((item) => item.status === 'queued')
    if (!next) return

    processingRef.current = true
    setItems((prev) =>
      prev.map((item) =>
        item.id === next.id ? { ...item, status: 'processing', error: null } : item,
      ),
    )

    const controller = new AbortController()
    abortRef.current = controller

    const run = async () => {
      let aborted = false
      try {
        const compressed = await compressImage(next.info, optionsRef.current, controller.signal)
        setItems((prev) =>
          prev.map((item) =>
            item.id === next.id ? { ...item, status: 'done', compressed, error: null } : item,
          ),
        )
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          aborted = true
        } else {
          setItems((prev) =>
            prev.map((item) =>
              item.id === next.id
                ? {
                    ...item,
                    status: 'error',
                    error: (error as Error).message || 'Compression error',
                  }
                : item,
            ),
          )
        }
      } finally {
        processingRef.current = false
        abortRef.current = null
        if (!aborted) {
          scheduleIdle(processQueue)
        }
      }
    }

    run()
  }, [])

  useEffect(() => {
    processQueue()
  }, [items, processQueue])

  const clear = useCallback(() => {
    abortRef.current?.abort()
    setItems((prev) => {
      prev.forEach(revokeItemUrls)
      return []
    })
    setActiveId(null)
  }, [setActiveId])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      itemsRef.current.forEach(revokeItemUrls)
    }
  }, [])

  useEffect(() => {
    if (!items.length) {
      setActiveId(null)
      return
    }
    if (!activeIdRef.current || !items.some((item) => item.id === activeIdRef.current)) {
      setActiveId(items[0].id)
    }
  }, [items, setActiveId])

  const activeItem = useMemo(
    () => items.find((item) => item.id === activeIdState) ?? null,
    [items, activeIdState],
  )

  const isProcessing = items.some((item) => item.status === 'processing')

  return {
    items,
    enqueueFiles,
    clear,
    activeId: activeIdState,
    setActiveId,
    activeItem,
    isProcessing,
  }
}
