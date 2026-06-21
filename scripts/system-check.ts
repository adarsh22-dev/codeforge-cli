import { execa } from 'execa'
import { readFileSync, existsSync } from 'node:fs'

async function main() {
  const checks: { name: string; status: string; detail?: string }[] = []

  // Node version
  const nodeVersion = process.version
  const nodeMajor = parseInt(nodeVersion.slice(1).split('.')[0], 10)
  checks.push({
    name: 'Node.js version',
    status: nodeMajor >= 22 ? 'pass' : 'fail',
    detail: nodeVersion,
  })

  // Bun version
  try {
    const { stdout } = await execa('bun', ['--version'])
    checks.push({ name: 'Bun version', status: 'pass', detail: stdout.trim() })
  } catch {
    checks.push({ name: 'Bun version', status: 'warn', detail: 'Not found (only needed for dev)' })
  }

  // Git
  try {
    const { stdout } = await execa('git', ['--version'])
    checks.push({ name: 'Git', status: 'pass', detail: stdout.trim() })
  } catch {
    checks.push({ name: 'Git', status: 'fail', detail: 'Not found' })
  }

  // ripgrep
  try {
    const { stdout } = await execa('rg', ['--version'])
    const firstLine = stdout.split('\n')[0]
    checks.push({ name: 'ripgrep', status: 'pass', detail: firstLine })
  } catch {
    checks.push({ name: 'ripgrep', status: 'warn', detail: 'Not found (used by Grep tool)' })
  }

  // Check dist
  const distExists = existsSync('./dist/cli.mjs')
  checks.push({
    name: 'CLI built',
    status: distExists ? 'pass' : 'warn',
    detail: distExists ? './dist/cli.mjs exists' : 'Run "bun run build" first',
  })

  // Provider env vars
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY
  const hasOpenAI = !!process.env.OPENAI_API_KEY
  checks.push({
    name: 'API keys configured',
    status: hasAnthropic || hasOpenAI ? 'pass' : 'warn',
    detail: hasAnthropic
      ? 'Anthropic key found'
      : hasOpenAI
        ? 'OpenAI key found'
        : 'No API keys set (use --provider-env-file or env vars)',
  })

  // Output
  console.log('Codeforge System Check')
  console.log('='.repeat(50))

  for (const check of checks) {
    const icon = check.status === 'pass' ? '✓' : check.status === 'warn' ? '⚠' : '✗'
    const color = check.status === 'pass' ? '' : check.status === 'warn' ? ' (optional)' : ''
    console.log(`  ${icon} ${check.name}${color}`)
    if (check.detail) {
      console.log(`     ${check.detail}`)
    }
  }

  const failures = checks.filter((c) => c.status === 'fail').length
  const warnings = checks.filter((c) => c.status === 'warn').length

  console.log(`\n${checks.length} checks: ${checks.length - failures - warnings} pass, ${warnings} warnings, ${failures} failures`)

  process.exit(failures > 0 ? 1 : 0)
}

main()
