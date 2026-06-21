import { z } from 'zod'
import { buildTool, type ToolUseContext } from '../../Tool.js'
import { executeBashCommand } from './bashSecurity.js'

const BashInput = z.object({
  command: z.string().describe('The shell command to execute'),
  description: z.string().optional().describe('What this command does'),
  workdir: z.string().optional().describe('Working directory for the command'),
  isBackground: z.boolean().optional().describe('Run in background'),
  timeout: z.number().optional().describe('Timeout in milliseconds'),
})

type BashInput = z.infer<typeof BashInput>

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

export const BashTool = buildTool<BashInput, BashOutput, BashProgress>({
  name: 'Bash',
  inputSchema: BashInput,
  userFacingName: 'Bash',

  description: (input) => input.description || `Run: ${input.command.slice(0, 80)}`,

  prompt: () => `## Bash
Execute shell commands. Returns stdout, stderr, and exit code.
Use \`description\` to explain what the command does.
Use \`workdir\` to set the working directory.
Use \`isBackground: true\` for long-running non-blocking commands.`,

  isReadOnly: () => false,
  isDestructive: () => true,
  isConcurrencySafe: () => false,

  validateInput: (input) => {
    if (!input.command || input.command.trim().length === 0) {
      return { result: false, message: 'Command cannot be empty', errorCode: 1 }
    }
    if (input.timeout && (input.timeout < 0 || input.timeout > 600000)) {
      return { result: false, message: 'Timeout must be between 0 and 600000ms', errorCode: 1 }
    }
    return { result: true }
  },

  checkPermissions: async (input, context) => {
    return { allowed: true }
  },

  call: async (input, _context, onProgress) => {
    return executeBashCommand(input, onProgress)
  },
})
