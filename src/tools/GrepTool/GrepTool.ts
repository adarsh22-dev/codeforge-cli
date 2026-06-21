import { z } from 'zod'
import { buildTool } from '../../Tool.js'
import { execa } from 'execa'
import { relative, resolve } from 'node:path'

const GrepInput = z.object({
  pattern: z.string().describe('Regex pattern to search for'),
  path: z.string().optional().describe('Directory or file to search in'),
  include: z.string().optional().describe('File pattern to include (e.g. "*.ts")'),
  maxResults: z.number().optional().describe('Maximum number of results'),
})

type GrepInput = z.infer<typeof GrepInput>

type GrepMatch = {
  file: string
  line: number
  content: string
}

type GrepOutput = {
  matches: GrepMatch[]
  total: number
  truncated: boolean
}

export const GrepTool = buildTool<GrepInput, GrepOutput>({
  name: 'Grep',
  inputSchema: GrepInput,
  userFacingName: 'Grep',

  description: (input) => `Search for: ${input.pattern}`,

  prompt: () => `## Grep
Search files for regex patterns. Returns matching file paths, line numbers, and content.
Use \`include\` to filter by file extension (e.g., "*.ts", "*.{ts,tsx}").`,

  isReadOnly: () => true,
  isDestructive: () => false,

  call: async (input) => {
    try {
      const searchPath = input.path ? resolve(input.path) : process.cwd()
      const maxResults = input.maxResults || 100

      const args = [
        '--line-number',
        '--with-filename',
        '--no-heading',
        '--color=never',
      ]

      if (input.include) {
        args.push('--glob', input.include)
      }

      args.push(input.pattern, searchPath)

      const result = await execa('rg', args, { timeout: 30_000, reject: false })

      if (result.exitCode === 1) {
        return { type: 'success', output: { matches: [], total: 0, truncated: false } }
      }

      if (result.exitCode !== 0) {
        return { type: 'error', error: result.stderr || `ripgrep exited with code ${result.exitCode}` }
      }

      const lines = result.stdout.trim().split('\n')
      const matches: GrepMatch[] = []

      for (const line of lines) {
        if (matches.length >= maxResults) break

        const match = parseRipgrepLine(line)
        if (match) {
          matches.push(match)
        }
      }

      return {
        type: 'success',
        output: {
          matches,
          total: lines.length,
          truncated: lines.length > maxResults,
        },
      }
    } catch (err: any) {
      return { type: 'error', error: `Grep failed: ${err.message}` }
    }
  },
})

function parseRipgrepLine(line: string): GrepMatch | null {
  const colonIdx = line.indexOf(':')
  if (colonIdx === -1) return null

  const restAfterFile = line.slice(colonIdx + 1)
  const secondColon = restAfterFile.indexOf(':')
  if (secondColon === -1) return null

  const file = line.slice(0, colonIdx)
  const lineNum = parseInt(restAfterFile.slice(0, secondColon), 10)
  const content = restAfterFile.slice(secondColon + 1)

  if (isNaN(lineNum)) return null

  return { file, line: lineNum, content }
}
