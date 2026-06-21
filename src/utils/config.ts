import { readFileSync, existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

export type Config = {
  defaultProvider?: string
  defaultModel?: string
  maxOutputTokens?: number
  disableThinking?: boolean
  dataDir: string
}

export function loadConfig(): Config {
  const dataDir = process.env.CODEFORGE_CONFIG_DIR ||
    join(homedir(), '.codeforge')

  // Try loading config file
  const configPath = join(dataDir, 'config.json')
  let fileConfig: Partial<Config> = {}

  if (existsSync(configPath)) {
    try {
      fileConfig = JSON.parse(readFileSync(configPath, 'utf-8'))
    } catch {
      // Ignore invalid config
    }
  }

  return {
    defaultProvider: process.env.CODEFORGE_DEFAULT_PROVIDER || fileConfig.defaultProvider,
    defaultModel: process.env.CODEFORGE_DEFAULT_MODEL || fileConfig.defaultModel,
    maxOutputTokens: parseInt(process.env.MAX_OUTPUT_TOKENS || '8192', 10),
    disableThinking: process.env.DISABLE_THINKING === 'true',
    dataDir,
  }
}
