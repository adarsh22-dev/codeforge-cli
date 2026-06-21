import { execa } from 'execa'

export async function isGitRepo(cwd?: string): Promise<boolean> {
  try {
    const { exitCode } = await execa('git', ['rev-parse', '--git-dir'], {
      cwd: cwd || process.cwd(),
      reject: false,
      timeout: 5000,
    })
    return exitCode === 0
  } catch {
    return false
  }
}

export async function getGitRoot(cwd?: string): Promise<string | null> {
  try {
    const { stdout } = await execa('git', ['rev-parse', '--show-toplevel'], {
      cwd: cwd || process.cwd(),
      timeout: 5000,
    })
    return stdout.trim()
  } catch {
    return null
  }
}

export async function getGitDiff(cwd?: string): Promise<string> {
  try {
    const { stdout } = await execa('git', ['diff', '--no-color'], {
      cwd: cwd || process.cwd(),
      timeout: 5000,
    })
    return stdout
  } catch {
    return ''
  }
}
