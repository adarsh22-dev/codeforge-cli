import { z } from 'zod'
import { buildTool } from '../../Tool.js'
import { glob } from 'node:fs/promises'
import { resolve } from 'node:path'

const GlobInput = z.object({
  pattern: z.string().describe('Glob pattern to match files (e.g. "src/**\/*.ts")'),
  path: z.string().optional().describe('Directory to search in'),
  maxResults: z.number().optional().describe('Maximum number of results'),
})

type GlobInput = z.infer<typeof GlobInput>

type GlobOutput = {
  files: string[]
  total: number
  truncated: boolean
}

export const GlobTool = buildTool<GlobInput, GlobOutput>({
  name: 'Glob',
  inputSchema: GlobInput,
  userFacingName: 'Glob',

  description: (input) => `Find files: ${input.pattern}`,

  prompt: () => `## Glob
Find files matching a glob pattern. Returns matching file paths.
Useful for exploring project structure and finding files by name/extension.`,

  isReadOnly: () => true,
  isDestructive: () => false,

  validateInput: (input) => {
    if (!input.pattern) {
      return { result: false, message: 'pattern is required', errorCode: 1 }
    }
    return { result: true }
  },

  call: async (input) => {
    try {
      const searchPath = input.path ? resolve(input.path) : process.cwd()
      const maxResults = input.maxResults || 200
      const files: string[] = []

      for await (const file of glob(input.pattern, { cwd: searchPath })) {
        if (files.length >= maxResults) break
        files.push(resolve(searchPath, file as string))
      }

      return {
        type: 'success',
        output: {
          files,
          total: files.length,
          truncated: files.length >= maxResults,
        },
      }
    } catch (err: any) {
      return { type: 'error', error: `Glob failed: ${err.message}` }
    }
  },
})
