import type { CompressionOptions, CompressedImage } from '../types'
import { convertImageFormat } from './compression'

export function convertImage(
  imageUrl: string,
  options: CompressionOptions,
  signal?: AbortSignal,
): Promise<CompressedImage> {
  return convertImageFormat(imageUrl, options, signal)
}
