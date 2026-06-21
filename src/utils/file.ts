import { access, constants } from 'node:fs'

export function isReadable(path: string): Promise<boolean> {
  return new Promise((resolve) => {
    access(path, constants.R_OK, (err) => resolve(!err))
  })
}

export function isWritable(path: string): Promise<boolean> {
  return new Promise((resolve) => {
    access(path, constants.W_OK, (err) => resolve(!err))
  })
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
