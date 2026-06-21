import { z } from 'zod'
import { buildTool } from '../../Tool.js'
import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, isAbsolute } from 'node:path'

const FileWriteInput = z.object({
  filePath: z.string().describe('Absolute path to the file to write'),
  content: z.string().describe('Content to write to the file'),
  append: z.boolean().optional().describe('Append to file instead of overwriting'),
})

type FileWriteInput = z.infer<typeof FileWriteInput>

type FileWriteOutput = {
  path: string
  bytesWritten: number
}

export const FileWriteTool = buildTool<FileWriteInput, FileWriteOutput>({
  name: 'FileWrite',
  inputSchema: FileWriteInput,
  userFacingName: 'FileWrite',

  description: (input) =>
    input.append ? `Append to file: ${input.filePath}` : `Write file: ${input.filePath}`,

  prompt: () => `## FileWrite
Write content to a file. Creates parent directories if they don't exist.
Use \`append: true\` to append to an existing file.`,

  isReadOnly: () => false,
  isDestructive: () => true,

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
      const parentDir = dirname(input.filePath)
      await mkdir(parentDir, { recursive: true })

      const flags = input.append ? 'a' : 'w'
      await writeFile(input.filePath, input.content, { flag: flags })

      return {
        type: 'success',
        output: {
          path: input.filePath,
          bytesWritten: Buffer.byteLength(input.content, 'utf-8'),
        },
      }
    } catch (err: any) {
      return { type: 'error', error: `Failed to write file: ${err.message}` }
    }
  },
})
