import type { Config } from '../utils/config.js'

let initialized = false

export async function init(config: Config): Promise<void> {
  if (initialized) return
  initialized = true

  // 1. Apply safe config env vars
  applySafeConfigEnvVars(config)

  // 2. Run any pending migrations
  await runMigrations()

  // 3. Initialize logging
  initLogging(config)
}

function applySafeConfigEnvVars(config: Config): void {
  if (config.maxOutputTokens) {
    process.env.MAX_OUTPUT_TOKENS ??= String(config.maxOutputTokens)
  }
}

async function runMigrations(): Promise<void> {
  // Placeholder for future migration logic
}

function initLogging(config: Config): void {
  // Placeholder for logging setup
}
