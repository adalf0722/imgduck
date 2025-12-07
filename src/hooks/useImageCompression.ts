import { useCallback, useEffect, useRef, useState } from 'react'
import { compressImage } from '../utils/compression'
import type {
  CompressedImage,
  CompressionOptions,
  ImageInfo,
} from '../types'

interface CompressionState {
  originalImage: ImageInfo | null
  compressedImage: CompressedImage | null
  isCompressing: boolean
  error: string | null
}

export function useImageCompression() {
  const [state, setState] = useState<CompressionState>({
    originalImage: null,
    compressedImage: null,
    isCompressing: false,
    error: null,
  })
  const abortRef = useRef<AbortController | null>(null)

  const revokeUrl = (url?: string) => {
    if (url) URL.revokeObjectURL(url)
  }

  const setOriginalImage = useCallback((image: ImageInfo | null) => {
    setState((prev) => {
      if (prev.originalImage?.url && prev.originalImage.url !== image?.url) {
        revokeUrl(prev.originalImage.url)
      }
      if (prev.compressedImage?.url) revokeUrl(prev.compressedImage.url)
      return {
        ...prev,
        originalImage: image,
        compressedImage: null,
        error: null,
      }
    })
  }, [])

  const compress = useCallback(
    async (imageInfo: ImageInfo, options: CompressionOptions) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setState((prev) => ({ ...prev, isCompressing: true, error: null }))

      try {
        const compressed = await compressImage(
          imageInfo,
          options,
          controller.signal,
        )
        setState((prev) => {
          if (prev.compressedImage?.url) revokeUrl(prev.compressedImage.url)
          return {
            ...prev,
            compressedImage: compressed,
            isCompressing: false,
          }
        })
      } catch (error) {
        if ((error as Error).name === 'AbortError') return
        setState((prev) => ({
          ...prev,
          isCompressing: false,
          error: (error as Error).message || 'Compression failed, please try again',
        }))
      }
    },
    [],
  )

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setState((prev) => {
      revokeUrl(prev.originalImage?.url)
      revokeUrl(prev.compressedImage?.url)
      return {
        originalImage: null,
        compressedImage: null,
        isCompressing: false,
        error: null,
      }
    })
  }, [])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      setState((prev) => {
        revokeUrl(prev.originalImage?.url)
        revokeUrl(prev.compressedImage?.url)
        return prev
      })
    }
  }, [])

  return {
    ...state,
    setOriginalImage,
    compress,
    reset,
  }
}
