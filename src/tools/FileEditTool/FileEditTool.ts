import { z } from 'zod'
import { buildTool } from '../../Tool.js'
import { readFile, writeFile } from 'node:fs/promises'
import { isAbsolute } from 'node:path'

const FileEditInput = z.object({
  filePath: z.string().describe('Absolute path to the file to edit'),
  oldString: z.string().describe('Text to replace'),
  newString: z.string().describe('Replacement text'),
  replaceAll: z.boolean().optional().describe('Replace all occurrences'),
})

type FileEditInput = z.infer<typeof FileEditInput>

type FileEditOutput = {
  path: string
  replacements: number
  diff: string
}

export const FileEditTool = buildTool<FileEditInput, FileEditOutput>({
  name: 'FileEdit',
  inputSchema: FileEditInput,
  userFacingName: 'FileEdit',

  description: (input) => `Edit file: ${input.filePath}`,

  prompt: () => `## FileEdit
Edit a file by finding and replacing text. Uses exact string matching.
Use \`replaceAll: true\` to replace all occurrences.`,

  isReadOnly: () => false,
  isDestructive: () => true,

  validateInput: (input) => {
    if (!input.filePath) {
      return { result: false, message: 'filePath is required', errorCode: 1 }
    }
    if (!isAbsolute(input.filePath)) {
      return { result: false, message: 'filePath must be an absolute path', errorCode: 1 }
    }
    if (!input.oldString) {
      return { result: false, message: 'oldString is required', errorCode: 1 }
    }
    if (input.oldString === input.newString) {
      return { result: false, message: 'oldString and newString must differ', errorCode: 1 }
    }
    return { result: true }
  },

  call: async (input) => {
    try {
      const content = await readFile(input.filePath, 'utf-8')

      if (input.replaceAll) {
        if (!content.includes(input.oldString)) {
          return {
            type: 'error',
            error: `Could not find "${input.oldString}" in ${input.filePath}`,
          }
        }

        const count = content.split(input.oldString).length - 1
        const newContent = content.replaceAll(input.oldString, input.newString)

        await writeFile(input.filePath, newContent, 'utf-8')

        return {
          type: 'success',
          output: { path: input.filePath, replacements: count, diff: generateDiff(content, newContent) },
        }
      } else {
        const idx = content.indexOf(input.oldString)
        if (idx === -1) {
          return {
            type: 'error',
            error: `Could not find "${input.oldString}" in ${input.filePath}`,
          }
        }

        const newContent = content.replace(input.oldString, input.newString)
        await writeFile(input.filePath, newContent, 'utf-8')

        return {
          type: 'success',
          output: { path: input.filePath, replacements: 1, diff: generateDiff(content, newContent) },
        }
      }
    } catch (err: any) {
      return { type: 'error', error: `Failed to edit file: ${err.message}` }
    }
  },
})

function generateDiff(oldContent: string, newContent: string): string {
  const oldLines = oldContent.split('\n')
  const newLines = newContent.split('\n')

  // Simple diff: just show changed sections
  const result: string[] = []
  const maxLen = Math.max(oldLines.length, newLines.length)

  for (let i = 0; i < maxLen; i++) {
    if (oldLines[i] !== newLines[i]) {
      if (oldLines[i] !== undefined) {
        result.push(`- ${oldLines[i]}`)
      }
      if (newLines[i] !== undefined) {
        result.push(`+ ${newLines[i]}`)
      }
    }
  }

  return result.join('\n')
}
