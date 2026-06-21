import { execa } from 'execa'
import type { ToolResult } from '../../Tool.js'

type BashInput = {
  command: string
  description?: string
  workdir?: string
  isBackground?: boolean
  timeout?: number
}

type BashOutput = {
  stdout: string
  stderr: string
  exitCode: number
}

type BashProgress = {
  type: 'stdout' | 'stderr' | 'exit'
  data?: string
  code?: number
}

const DESTRUCTIVE_PATTERNS = [
  /^rm\s+-rf\s+\/\s*$/,
  /^dd\s+if=.+\s+of=\/dev\/sda/,
  /^mkfs\./,
  /^:\(\)\{:\|:&\};:/,
]

export function isDestructiveCommand(command: string): boolean {
  const trimmed = command.trim().toLowerCase()
  return DESTRUCTIVE_PATTERNS.some((pattern) => pattern.test(trimmed))
}

export async function executeBashCommand(
  input: BashInput,
  onProgress?: (progress: BashProgress) => void
): Promise<ToolResult<BashOutput>> {
  try {
    const subprocess = execa(input.command, {
      shell: true,
      cwd: input.workdir || process.cwd(),
      timeout: input.timeout || 120_000,
      all: false,
      buffer: true,
    })

    if (subprocess.stdout) {
      subprocess.stdout.on('data', (data: Buffer) => {
        onProgress?.({ type: 'stdout', data: data.toString() })
      })
    }

    if (subprocess.stderr) {
      subprocess.stderr.on('data', (data: Buffer) => {
        onProgress?.({ type: 'stderr', data: data.toString() })
      })
    }

    const result = await subprocess

    onProgress?.({ type: 'exit', code: result.exitCode })

    return {
      type: 'success',
      output: {
        stdout: result.stdout || '',
        stderr: result.stderr || '',
        exitCode: result.exitCode ?? 0,
      },
    }
  } catch (err: any) {
    return {
      type: 'error',
      error: err.stderr || err.message || 'Command failed',
      output: {
        stdout: err.stdout || '',
        stderr: err.stderr || '',
        exitCode: err.exitCode ?? 1,
      },
    }
  }
}
