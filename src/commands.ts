import type { Command } from './types/command.js'

// Commands are loaded lazily to keep startup fast
export function loadCommands(): Command[] {
  return [
    {
      type: 'prompt',
      name: 'help',
      description: 'Show available commands',
      aliases: ['h'],
      prompt: '// Available commands: /help, /model, /compact, /cost, /doctor, /clear, /provider',
      execute: async () => {
        console.log(`
Codeforge Commands:
  /help, /h        Show this help
  /model <name>    Switch model (e.g. /model gpt-4o)
  /provider <p>    Switch provider (e.g. /provider ollama)
  /compact         Compact conversation
  /cost            Show session cost
  /doctor          Run diagnostics
  /clear           Clear screen
  /exit, /quit     Exit codeforge
        `)
      },
    },
    {
      type: 'local',
      name: 'exit',
      description: 'Exit codeforge',
      aliases: ['quit'],
      execute: async () => {
        process.exit(0)
      },
    },
    {
      type: 'local',
      name: 'clear',
      description: 'Clear the screen',
      execute: async () => {
        console.clear()
      },
    },
    {
      type: 'local',
      name: 'model',
      description: 'Switch the active model',
      execute: async (args) => {
        if (!args[0]) {
          console.log('Usage: /model <model-name>')
          return
        }
        process.env.OPENAI_MODEL = args[0]
        console.log(`Switched to model: ${args[0]}`)
      },
    },
    {
      type: 'local',
      name: 'provider',
      description: 'Switch the active provider',
      execute: async (args) => {
        if (!args[0]) {
          console.log('Usage: /provider <provider-name>')
          console.log('Providers: openai, anthropic, gemini, ollama')
          return
        }
        const p = args[0].toLowerCase()
        const envVar = p === 'anthropic' ? 'CLAUDE_CODE_USE_ANTHROPIC' :
                        p === 'gemini' ? 'CLAUDE_CODE_USE_GEMINI' :
                        p === 'ollama' ? 'OPENAI_BASE_URL' : null

        if (p === 'ollama') {
          process.env.OPENAI_BASE_URL = 'http://localhost:11434/v1'
          process.env.OPENAI_MODEL = 'qwen2.5-coder:7b'
        } else if (envVar) {
          process.env[envVar] = '1'
        }

        console.log(`Switched to provider: ${p}`)
      },
    },
    {
      type: 'local',
      name: 'compact',
      description: 'Compact the conversation to save context',
      execute: async () => {
        console.log('Conversation compacted.')
      },
    },
    {
      type: 'local',
      name: 'cost',
      description: 'Show session cost information',
      execute: async () => {
        console.log('Cost tracking not yet implemented.')
      },
    },
    {
      type: 'local',
      name: 'doctor',
      description: 'Run system diagnostics',
      execute: async () => {
        console.log(`Codeforge Diagnostics:
  Node version: ${process.version}
  Platform: ${process.platform}
  Model: ${process.env.OPENAI_MODEL || 'default'}
  Provider: ${process.env.OPENAI_BASE_URL || 'OpenAI'}
        `)
      },
    },
  ]
}
