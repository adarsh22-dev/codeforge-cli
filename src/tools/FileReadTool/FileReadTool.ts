import { z } from 'zod'
import { buildTool } from '../../Tool.js'
import { readFile } from 'node:fs/promises'
import { access } from 'node:fs/promises'
import { constants } from 'node:fs'
import { join, isAbsolute } from 'node:path'

const FileReadInput = z.object({
  filePath: z.string().describe('Absolute path to the file to read'),
  offset: z.number().optional().describe('Line number to start from (1-indexed)'),
  limit: z.number().optional().describe('Maximum number of lines to read'),
})

type FileReadInput = z.infer<typeof FileReadInput>

type FileReadOutput = {
  content: string
  lineCount: number
  truncated: boolean
}

export const FileReadTool = buildTool<FileReadInput, FileReadOutput>({
  name: 'FileRead',
  inputSchema: FileReadInput,
  userFacingName: 'FileRead',

  description: (input) => `Read file: ${input.filePath}`,

  prompt: () => `## FileRead
Read the contents of a file. Returns the full content or a range of lines.
Use \`offset\` and \`limit\` to read specific sections of large files.`,

  isReadOnly: () => true,
  isDestructive: () => false,

  validateInput: (input) => {
    if (!input.filePath) {
      return { result: false, message: 'filePath is required', errorCode: 1 }
    }
    if (!isAbsolute(input.filePath)) {
      return { result: false, message: 'filePath must be an absolute path', errorCode: 1 }
    }
    return { result: true }
  },

  call: async (input) => {
    try {
      await access(input.filePath, constants.R_OK)
    } catch {
      return { type: 'error', error: `File not found or not readable: ${input.filePath}` }
    }

    try {
      const content = await readFile(input.filePath, 'utf-8')
      const lines = content.split('\n')
      const totalLines = lines.length

      let result = content
      let truncated = false

      if (input.offset !== undefined || input.limit !== undefined) {
        const start = input.offset ? Math.max(0, input.offset - 1) : 0
        const end = input.limit ? start + input.limit : totalLines
        result = lines.slice(start, end).join('\n')
        truncated = end < totalLines
      }

      return {
        type: 'success',
        output: { content: result, lineCount: totalLines, truncated },
      }
    } catch (err: any) {
      return { type: 'error', error: `Failed to read file: ${err.message}` }
    }
  },
})
