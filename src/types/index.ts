export type CompressionFormat = 'webp' | 'mozjpeg' | 'oxipng'

export interface CompressionOptions {
  format: CompressionFormat
  quality: number
  maxWidth?: number
  maxHeight?: number
}

export interface ImageInfo {
  file: File
  url: string
  width: number
  height: number
  size: number
}

export interface CompressedImage {
  blob: Blob
  url: string
  size: number
  format: CompressionFormat
}
