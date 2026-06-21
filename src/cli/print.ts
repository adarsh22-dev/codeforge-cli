import type { Store } from '../state/store.js'
import type { AppState } from '../state/AppState.js'
import type { APIClient } from '../services/api/client.js'
import type { Tool } from '../Tool.js'
import { executeQuery } from '../query.js'
import { loadCommands } from '../commands.js'

export type HeadlessOptions = {
  store: Store<AppState>
  apiClient: APIClient
  tools: Tool<any, any, any>[]
  model: string
  prompt: string
}

export async function runHeadless(options: HeadlessOptions): Promise<void> {
  const { store, apiClient, tools, prompt } = options

  const systemPrompt = `You are Codeforge, a coding assistant.
You have access to tools. Use them to help the user.
When you use a tool, wait for the result before continuing.`

  // Add user message
  const messages = [
    {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content: prompt,
      timestamp: Date.now(),
    },
  ]

  store.setState({ messages })

  const result = await executeQuery({
    messages,
    tools,
    apiClient,
    systemPrompt,
    store,
  })

  // Print the final assistant message
  const lastMsg = result.messages[result.messages.length - 1]
  if (lastMsg && lastMsg.role === 'assistant') {
    const text = typeof lastMsg.content === 'string'
      ? lastMsg.content
      : lastMsg.content.find((b) => b.type === 'text')?.text || ''
    if (text) {
      process.stdout.write(text + '\n')
    }
  }
}
