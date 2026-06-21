import { execa } from 'execa'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { mkdir, readdir, readFile, writeFile, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'

const SESSIONS_DIR = join(homedir(), '.codeforge', 'bg-sessions')

export async function handleBgCommands(args: string[]): Promise<void> {
  const cmd = args[0]

  switch (cmd) {
    case 'ps':
      await listSessions()
      break
    case 'logs':
      await showLogs(args[1])
      break
    case 'kill':
      await killSession(args[1])
      break
    case 'attach':
      console.log('Attach not yet implemented. Use: codeforge logs <name> -f')
      break
  }
}

export async function launchBackground(args: string[]): Promise<void> {
  await mkdir(SESSIONS_DIR, { recursive: true })

  const nameIdx = args.indexOf('--name')
  const name = nameIdx !== -1 && args[nameIdx + 1]
    ? args[nameIdx + 1]
    : `session-${Date.now()}`

  // Find the prompt after flags
  const promptParts = args.filter((a) => !a.startsWith('--'))
  const prompt = promptParts.join(' ')

  console.log(`Starting background session: ${name}`)

  const sessionDir = join(SESSIONS_DIR, name)
  await mkdir(sessionDir, { recursive: true })

  const logFile = join(sessionDir, 'output.log')
  const metaFile = join(sessionDir, 'meta.json')

  await writeFile(metaFile, JSON.stringify({
    name,
    started: new Date().toISOString(),
    prompt,
    status: 'running',
  }, null, 2))

  const child = execa('node', [join(process.cwd(), 'dist', 'cli.mjs'), '--print', prompt], {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  })

  child.stdout?.pipe(require('node:fs').createWriteStream(logFile, { flags: 'a' }))
  child.stderr?.pipe(require('node:fs').createWriteStream(logFile, { flags: 'a' }))

  child.on('exit', async () => {
    await writeFile(metaFile, JSON.stringify({
      name,
      started: new Date().toISOString(),
      prompt,
      status: 'completed',
      exitCode: child.exitCode,
    }, null, 2))
  })

  child.unref()

  console.log(`Session "${name}" started in background (PID: ${child.pid})`)
  console.log(`Logs: codeforge logs ${name}`)
}

async function listSessions(): Promise<void> {
  if (!existsSync(SESSIONS_DIR)) {
    console.log('No background sessions.')
    return
  }

  const entries = await readdir(SESSIONS_DIR, { withFileTypes: true })
  const dirs = entries.filter((e) => e.isDirectory())

  if (dirs.length === 0) {
    console.log('No background sessions.')
    return
  }

  console.log('Background sessions:')
  for (const dir of dirs) {
    const metaPath = join(SESSIONS_DIR, dir.name, 'meta.json')
    if (existsSync(metaPath)) {
      try {
        const meta = JSON.parse(await readFile(metaPath, 'utf-8'))
        console.log(`  ${dir.name}  [${meta.status}]  ${meta.prompt?.slice(0, 60)}`)
      } catch {
        console.log(`  ${dir.name}  [unknown]`)
      }
    } else {
      console.log(`  ${dir.name}`)
    }
  }
}

async function showLogs(name?: string): Promise<void> {
  if (!name) {
    console.log('Usage: codeforge logs <session-name>')
    return
  }

  const logPath = join(SESSIONS_DIR, name, 'output.log')
  if (!existsSync(logPath)) {
    console.log(`Session "${name}" not found.`)
    return
  }

  const content = await readFile(logPath, 'utf-8')
  console.log(content)
}

async function killSession(name?: string): Promise<void> {
  if (!name) {
    console.log('Usage: codeforge kill <session-name>')
    return
  }

  const sessionDir = join(SESSIONS_DIR, name)
  if (!existsSync(sessionDir)) {
    console.log(`Session "${name}" not found.`)
    return
  }

  await rm(sessionDir, { recursive: true, force: true })
  console.log(`Session "${name}" killed.`)
}
