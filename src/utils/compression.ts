import imageCompression from 'browser-image-compression'
import type {
  CompressedImage,
  CompressionOptions,
  CompressionFormat,
  ImageInfo,
} from '../types'
import { loadImage } from './fileUtils'

const MIME_MAP: Record<CompressionFormat, string> = {
  webp: 'image/webp',
  mozjpeg: 'image/jpeg',
  oxipng: 'image/png',
}

const PROCESS_TIMEOUT = 30_000

function fitSize(
  width: number,
  height: number,
  maxWidth?: number,
  maxHeight?: number,
) {
  if (!maxWidth && !maxHeight) return { width, height }
  const ratio = width / height
  let targetWidth = width
  let targetHeight = height

  if (maxWidth && targetWidth > maxWidth) {
    targetWidth = maxWidth
    targetHeight = Math.round(targetWidth / ratio)
  }

  if (maxHeight && targetHeight > maxHeight) {
    targetHeight = maxHeight
    targetWidth = Math.round(targetHeight * ratio)
  }

  return { width: targetWidth, height: targetHeight }
}

function withTimeout<T>(
  promise: Promise<T>,
  signal?: AbortSignal,
  timeoutMs = PROCESS_TIMEOUT,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Processing timed out, please retry')), timeoutMs)
    const abort = () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    }

    if (signal) {
      if (signal.aborted) {
        abort()
        return
      }
      signal.addEventListener('abort', abort, { once: true })
    }

    promise
      .then((value) => {
        clearTimeout(timer)
        resolve(value)
      })
      .catch((error) => {
        clearTimeout(timer)
        reject(error)
      })
  })
}

async function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality?: number,
  signal?: AbortSignal,
): Promise<Blob> {
  const toBlobPromise = new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('Unable to create compressed file'))
        else resolve(blob)
      },
      mimeType,
      quality,
    )
  })

  return withTimeout(toBlobPromise, signal)
}

export async function compressImage(
  imageInfo: ImageInfo,
  options: CompressionOptions,
  signal?: AbortSignal,
): Promise<CompressedImage> {
  const { width, height, image } = await loadImage(imageInfo.url, signal)
  const { width: targetWidth, height: targetHeight } = fitSize(
    width,
    height,
    options.maxWidth,
    options.maxHeight,
  )

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas initialization failed')
  ctx.drawImage(image, 0, 0, targetWidth, targetHeight)

  if (options.format === 'oxipng') {
    const pngBlob = await canvasToBlob(
      canvas,
      MIME_MAP[options.format],
      undefined,
      signal,
    )
    const pngFile = new File([pngBlob], imageInfo.file?.name || 'image.png', {
      type: MIME_MAP[options.format],
    })
    const compressedPng = await withTimeout(
      imageCompression(pngFile, {
        fileType: MIME_MAP[options.format],
        initialQuality: options.quality / 100,
        maxWidthOrHeight: Math.max(targetWidth, targetHeight),
      }),
      signal,
    )
    const url = URL.createObjectURL(compressedPng)
    try {
      return {
        blob: compressedPng,
        url,
        size: compressedPng.size,
        format: options.format,
      }
    } catch (error) {
      URL.revokeObjectURL(url)
      throw error
    }
  }

  const quality = Math.min(Math.max(options.quality / 100, 0), 1)
  const blob = await canvasToBlob(canvas, MIME_MAP[options.format], quality, signal)
  const url = URL.createObjectURL(blob)

  try {
    return {
      blob,
      url,
      size: blob.size,
      format: options.format,
    }
  } catch (error) {
    URL.revokeObjectURL(url)
    throw error
  }
}

export async function convertImageFormat(
  imageUrl: string,
  options: CompressionOptions,
  signal?: AbortSignal,
): Promise<CompressedImage> {
  const { width, height } = await loadImage(imageUrl, signal)
  const virtualInfo: ImageInfo = {
    file: new File([], 'virtual'),
    url: imageUrl,
    width,
    height,
    size: 0,
  }
  return compressImage(virtualInfo, options, signal)
}
