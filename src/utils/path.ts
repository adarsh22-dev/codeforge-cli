import { isAbsolute, resolve, relative } from 'node:path'

export function ensureAbsolute(filePath: string, cwd?: string): string {
  if (isAbsolute(filePath)) return filePath
  return resolve(cwd || process.cwd(), filePath)
}

export function makeRelative(filePath: string, cwd?: string): string {
  return relative(cwd || process.cwd(), filePath)
}

export function isWithinDirectory(parent: string, child: string): boolean {
  const rel = relative(parent, child)
  return !rel.startsWith('..') && !isAbsolute(rel)
}
