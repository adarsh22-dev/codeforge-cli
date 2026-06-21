import { readFileSync, existsSync } from 'node:fs'

export function loadEnvFile(path: string): void {
  if (!existsSync(path)) {
    console.warn(`Warning: env file not found: ${path}`)
    return
  }

  const content = readFileSync(path, 'utf-8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue

    const key = trimmed.slice(0, eqIdx).trim()
    const value = trimmed.slice(eqIdx + 1).trim()

    if (key && !process.env[key]) {
      process.env[key] = value
    }
  }
}
