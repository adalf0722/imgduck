import type { ImageInfo } from '../types'

const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  )
  const size = bytes / 1024 ** exponent
  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[exponent]}`
}

export function validateImageFile(
  file: File,
): { valid: boolean; error?: string } {
  if (!SUPPORTED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: '僅支援 JPEG / PNG / WebP / GIF 檔案',
    }
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: '檔案大小不得超過 50MB',
    }
  }

  return { valid: true }
}

export async function getImageInfo(file: File): Promise<ImageInfo> {
  const url = URL.createObjectURL(file)

  try {
    const { width, height } = await loadImage(url)
    return {
      file,
      url,
      width,
      height,
      size: file.size,
    }
  } catch (error) {
    URL.revokeObjectURL(url)
    throw error
  }
}

export function loadImage(
  url: string,
  signal?: AbortSignal,
): Promise<{ width: number; height: number; image: HTMLImageElement }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () =>
      resolve({ width: img.width, height: img.height, image: img })
    img.onerror = () => reject(new Error('無法載入圖片'))
    if (signal) {
      signal.addEventListener(
        'abort',
        () => {
          img.src = ''
          reject(new DOMException('Aborted', 'AbortError'))
        },
        { once: true },
      )
    }
    img.src = url
  })
}
