import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

export function ensureDirectories(): void {
  const dirs = [
    join(homedir(), '.codeforge'),
    join(homedir(), '.codeforge', 'bg-sessions'),
  ]

  for (const dir of dirs) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
  }
}
