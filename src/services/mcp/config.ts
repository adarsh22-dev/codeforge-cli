import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

export type MCPConfig = {
  servers: Record<string, {
    command: string
    args?: string[]
    env?: Record<string, string>
  }>
}

export function loadMCPConfig(): MCPConfig {
  const paths = [
    join(process.cwd(), '.codeforge', 'mcp.json'),
    join(homedir(), '.codeforge', 'mcp.json'),
  ]

  for (const configPath of paths) {
    if (existsSync(configPath)) {
      try {
        return JSON.parse(readFileSync(configPath, 'utf-8'))
      } catch {
        // Invalid config
      }
    }
  }

  return { servers: {} }
}
