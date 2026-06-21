import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs'
import { join, dirname } from 'node:path'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))
const version = pkg.version

const CLI_EXTERNALS = [
  // Node built-ins
  'node:fs', 'node:path', 'node:child_process', 'node:os',
  'node:crypto', 'node:url', 'node:stream', 'node:buffer',
  'node:readline', 'node:process', 'node:events', 'node:util',
  'node:assert', 'node:tty',

  // Heavy native modules - keep external
  '@vscode/ripgrep',
  'sharp',

  // React + Ink (bundled separately)
  'react', 'react-reconciler', 'ink',

  // MCP SDK
  '@modelcontextprotocol/sdk',

  // CLI framework
  'commander',
]

const SDK_EXTERNALS = [
  ...CLI_EXTERNALS,
  'react', 'react-reconciler', 'ink',
  'ink-text-input',
  'chalk',
  'marked',
]

async function build() {
  console.log(`Building Codeforge v${version}...`)

  // Ensure dist directory
  if (!existsSync('dist')) {
    mkdirSync('dist', { recursive: true })
  }

  // Build CLI bundle
  console.log('Building CLI bundle...')

  const cliResult = await Bun.build({
    entrypoints: ['./src/entrypoints/cli.tsx'],
    outdir: './dist',
    naming: 'cli.mjs',
    target: 'node',
    format: 'esm',
    sourcemap: 'external',
    external: CLI_EXTERNALS,
  })

  if (!cliResult.success) {
    console.error('CLI build failed:')
    for (const log of cliResult.logs) {
      console.error(log)
    }
    process.exit(1)
  }

  console.log('CLI bundle built successfully.')

  // Build SDK bundle
  console.log('Building SDK bundle...')

  if (existsSync('./src/entrypoints/sdk/index.ts')) {
    const sdkResult = await Bun.build({
      entrypoints: ['./src/entrypoints/sdk/index.ts'],
      outdir: './dist',
      naming: 'sdk.mjs',
      target: 'node',
      format: 'esm',
      sourcemap: 'external',
      external: SDK_EXTERNALS,
    })

    if (!sdkResult.success) {
      console.error('SDK build failed:')
      for (const log of sdkResult.logs) {
        console.error(log)
      }
      process.exit(1)
    }

    console.log('SDK bundle built successfully.')
  }

  // Verify output
  const cliPath = './dist/cli.mjs'
  if (existsSync(cliPath)) {
    const stats = await import('node:fs').then((fs) => fs.promises.stat(cliPath))
    console.log(`CLI bundle: ${(stats.size / 1024).toFixed(1)} KB`)
  }

  console.log('Build complete.')
}

build().catch((err) => {
  console.error('Build failed:', err)
  process.exit(1)
})
