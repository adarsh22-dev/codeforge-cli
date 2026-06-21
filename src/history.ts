import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

const HISTORY_FILE = join(homedir(), '.codeforge', 'history.json')

export function loadHistory(): string[] {
  if (!existsSync(HISTORY_FILE)) return []
  try {
    const data = JSON.parse(readFileSync(HISTORY_FILE, 'utf-8'))
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export function appendToHistory(entry: string): void {
  const history = loadHistory()
  history.push(entry)

  // Keep last 100 entries
  const trimmed = history.slice(-100)

  try {
    writeFileSync(HISTORY_FILE, JSON.stringify(trimmed, null, 2), 'utf-8')
  } catch {
    // Ignore write failures
  }
}
