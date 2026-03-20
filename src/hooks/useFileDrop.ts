import { useCallback, useEffect, useState } from 'react'
import { validateImageFile } from '../utils/fileUtils'

type DropEntryBase = {
  isFile: boolean
  isDirectory: boolean
  name: string
}

type DropFileEntry = DropEntryBase & {
  file: (success: (file: File) => void, error?: (err: DOMException) => void) => void
}

type DropDirectoryReader = {
  readEntries: (success: (entries: DropEntry[]) => void, error?: (err: DOMException) => void) => void
}

type DropDirectoryEntry = DropEntryBase & {
  createReader: () => DropDirectoryReader
}

type DropEntry = DropFileEntry | DropDirectoryEntry
type DataTransferItemWithEntry = DataTransferItem & {
  webkitGetAsEntry?: () => DropEntry | null
}

const isFileEntry = (entry: DropEntry): entry is DropFileEntry => entry.isFile
const isDirectoryEntry = (entry: DropEntry): entry is DropDirectoryEntry => entry.isDirectory

const readEntryFiles = async (entry: DropEntry): Promise<File[]> => {
  const readNextBatch = (directoryReader: DropDirectoryReader): Promise<DropEntry[]> =>
    new Promise<DropEntry[]>((resolve, reject) => {
      directoryReader.readEntries(
        (nextEntries) => resolve(nextEntries),
        (error) => {
          console.error('Failed to read dropped directory entry', error)
          reject(error)
        },
      )
    })

  const stack: DropEntry[] = [entry]
  const files: File[] = []

  while (stack.length) {
    const current = stack.pop()
    if (!current) break

    if (isFileEntry(current)) {
      const file = await new Promise<File | null>((resolve) => {
        current.file(
          (f) => resolve(f),
          (error) => {
            console.error('Failed to read dropped file entry', error)
            resolve(null)
          },
        )
      })
      if (file) files.push(file)
      continue
    }

    if (!isDirectoryEntry(current)) continue

    const reader = current.createReader()
    let hasMoreEntries = true
    while (hasMoreEntries) {
      const entries = await readNextBatch(reader)
      hasMoreEntries = entries.length > 0
      if (!hasMoreEntries) break
      for (const child of entries) {
        stack.push(child)
      }
    }
  }

  return files
}

const filterSupportedFiles = (files: File[]) =>
  files.filter((file) => validateImageFile(file).valid)

export function useFileDrop(onDrop: (files: FileList | File[]) => void) {
  const [target, setTarget] = useState<HTMLDivElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const dropRef = useCallback((node: HTMLDivElement | null) => {
    setTarget(node)
  }, [])

  useEffect(() => {
    if (!target) return

    const handleDragOver = (event: DragEvent) => {
      event.preventDefault()
      setIsDragging(true)
    }

    const handleDragLeave = (event: DragEvent) => {
      event.preventDefault()
      if (!target.contains(event.relatedTarget as Node)) {
        setIsDragging(false)
      }
    }

    const handleDrop = async (event: DragEvent) => {
      event.preventDefault()
      setIsDragging(false)
      const dataTransfer = event.dataTransfer
      if (!dataTransfer) return

      // Prefer webkitGetAsEntry (desktop browsers) to traverse folders and skip unsupported files quietly.
      if (dataTransfer.items?.length) {
        const entryCandidates = Array.from(dataTransfer.items).map(
          (item) => ((item as DataTransferItemWithEntry).webkitGetAsEntry?.() as DropEntry | null) ?? null,
        )
        const entries: DropEntry[] = entryCandidates.filter(
          (entry): entry is DropEntry => entry !== null,
        )

        if (entries.length) {
          try {
            const batches = await Promise.all(entries.map((entry) => readEntryFiles(entry)))
            const files = filterSupportedFiles(batches.flat())
            if (files.length) {
              onDrop(files)
            }
          } catch (error) {
            console.error('Failed to read dropped entries', error)
          }
          return
        }
      }

      if (dataTransfer.files?.length) {
        onDrop(dataTransfer.files)
      }
    }

    target.addEventListener('dragover', handleDragOver)
    target.addEventListener('dragleave', handleDragLeave)
    target.addEventListener('drop', handleDrop)

    return () => {
      target.removeEventListener('dragover', handleDragOver)
      target.removeEventListener('dragleave', handleDragLeave)
      target.removeEventListener('drop', handleDrop)
    }
  }, [onDrop, target])

  return { dropRef, isDragging }
}
