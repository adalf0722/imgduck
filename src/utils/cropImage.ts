import type { ImageInfo } from '../types'
import { loadImage } from './fileUtils'

export interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

const blobFromCanvas = (canvas: HTMLCanvasElement, type: string): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Unable to create cropped image'))
          return
        }
        resolve(blob)
      },
      type,
      1,
    )
  })

export async function cropImageInfo(imageInfo: ImageInfo, crop: CropArea): Promise<ImageInfo> {
  const { image } = await loadImage(imageInfo.url)
  const width = Math.max(1, Math.round(crop.width))
  const height = Math.max(1, Math.round(crop.height))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas initialization failed')

  ctx.drawImage(
    image,
    Math.round(crop.x),
    Math.round(crop.y),
    width,
    height,
    0,
    0,
    width,
    height,
  )

  const mimeType = imageInfo.file.type || 'image/png'
  const blob = await blobFromCanvas(canvas, mimeType)
  const fileName = imageInfo.file?.name || 'image'
  const file = new File([blob], fileName, { type: mimeType })
  const url = URL.createObjectURL(blob)

  return {
    file,
    url,
    width,
    height,
    size: blob.size,
  }
}
