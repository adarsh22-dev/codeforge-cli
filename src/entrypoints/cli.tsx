import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'))
const version = pkg.version

type Importers = {
  main: () => Promise<typeof import('../main.js')>
  bg: () => Promise<typeof import('../cli/bg.js')>
  providerFlag: () => Promise<typeof import('../utils/providerFlag.js')>
  envFile: () => Promise<typeof import('../utils/envFile.js')>
  config: () => Promise<typeof import('../utils/config.js')>
}

const importers: Importers = {
  main: () => import('../main.js'),
  bg: () => import('../cli/bg.js'),
  providerFlag: () => import('../utils/providerFlag.js'),
  envFile: () => import('../utils/envFile.js'),
  config: () => import('../utils/config.js'),
}

async function main() {
  const args = process.argv.slice(2)

  // Fast path: background session management
  if (args[0] === 'ps' || args[0] === 'logs' || args[0] === 'kill' || args[0] === 'attach') {
    const bg = await importers.bg()
    await bg.handleBgCommands(args)
    process.exit(0)
  }

  // Process --provider-env-file early
  const envFileIdx = args.indexOf('--provider-env-file')
  if (envFileIdx !== -1 && args[envFileIdx + 1]) {
    const ef = await importers.envFile()
    ef.loadEnvFile(args[envFileIdx + 1])
  }

  // Process --provider flag early
  const providerIdx = args.indexOf('--provider')
  if (providerIdx !== -1 && args[providerIdx + 1]) {
    const pf = await importers.providerFlag()
    pf.applyProviderFlag(args[providerIdx + 1])
  }

  // Handle --bg
  const bgIdx = args.indexOf('--bg')
  if (bgIdx !== -1) {
    const bg = await importers.bg()
    await bg.launchBackground(args)
    process.exit(0)
  }

  // Load config
  const config = await importers.config()
  const resolvedConfig = config.loadConfig()

  // Full bootstrap: load main
  const mainModule = await importers.main()
  await mainModule.runMain({ version, config: resolvedConfig, args })
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
