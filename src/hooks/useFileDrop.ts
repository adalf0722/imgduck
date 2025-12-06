import { useCallback, useEffect, useState } from 'react'

export function useFileDrop(onDrop: (files: FileList) => void) {
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

    const handleDrop = (event: DragEvent) => {
      event.preventDefault()
      setIsDragging(false)
      if (event.dataTransfer?.files?.length) {
        onDrop(event.dataTransfer.files)
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
