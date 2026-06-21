import React, { useCallback, useEffect } from 'react'
import { render, Box, Text } from 'ink'
import { AppStateProvider, useAppState, useSetAppState, useAppStateStore, type AppState } from '../state/AppState.js'
import type { Store } from '../state/store.js'
import type { APIClient } from '../services/api/client.js'
import type { Tool } from '../Tool.js'
import type { Command } from '../types/command.js'
import { MessageList } from '../components/messages/Messages.js'
import { PromptInput } from '../components/PromptInput/PromptInput.js'
import { StatusLine } from '../components/StatusLine.js'
import { executeQuery } from '../query.js'
import { SYSTEM_PROMPT } from '../constants/prompts.js'
import { BRAND } from '../constants/brand.js'
import * as readline from 'node:readline'

export type REPLOptions = {
  store: Store<AppState>
  apiClient: APIClient
  tools: Tool<any, any, any>[]
  commands: Command[]
  model: string
  version: string
}

export async function launchRepl(options: REPLOptions): Promise<void> {
  const { store, apiClient, tools, commands, model, version } = options

  // Check if we're in a real TTY — if not, fall back to readline
  if (!process.stdin.isTTY) {
    return launchReadlineRepl(options)
  }

  const node = React.createElement(AppWithProps, {
    store,
    apiClient,
    tools,
    commands,
    model,
    version,
  } as any)

  render(node as any)
}

async function launchReadlineRepl(options: REPLOptions): Promise<void> {
  const { store, apiClient, tools, commands, version } = options

  console.log(`\n  ${BRAND.name} v${version} — ${BRAND.tagline}`)
  console.log('  Type /help for commands, /exit to quit\n')

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '❯ ',
  })

  rl.prompt()

  for await (const line of rl) {
    const trimmed = line.trim()
    if (!trimmed) { rl.prompt(); continue }

    if (trimmed === '/exit' || trimmed === '/quit') {
      rl.close()
      process.exit(0)
    }

    if (trimmed.startsWith('/')) {
      const parts = trimmed.slice(1).split(' ')
      const cmdName = parts[0].toLowerCase()
      const cmdArgs = parts.slice(1)
      const command = commands.find((c) => c.name === cmdName || c.aliases?.includes(cmdName))
      if (command?.execute) {
        await command.execute(cmdArgs)
      } else {
        console.log(`Unknown command: /${cmdName}. Type /help for available commands.`)
      }
      rl.prompt()
      continue
    }

    const userMsg: any = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    }
    store.setState({ messages: [...store.getState().messages, userMsg], isProcessing: true })

    const result = await executeQuery({
      messages: [...store.getState().messages, userMsg],
      tools,
      apiClient,
      systemPrompt: SYSTEM_PROMPT,
      store,
    })

    // Print the assistant response
    const lastMsg = result.messages[result.messages.length - 1]
    if (lastMsg && lastMsg.role === 'assistant') {
      const text = typeof lastMsg.content === 'string'
        ? lastMsg.content
        : (lastMsg.content as any[]).find((b: any) => b.type === 'text')?.text || ''
      if (text) console.log(text)
    }
    if (result.error) console.log(`Error: ${result.error}`)

    rl.prompt()
  }
}

function AppWithProps({
  store,
  apiClient,
  tools,
  commands,
  model,
  version,
}: REPLOptions) {
  return (
    <AppStateProvider store={store}>
      <REPLScreenContent
        apiClient={apiClient}
        tools={tools}
        commands={commands}
        version={version}
      />
    </AppStateProvider>
  )
}

function REPLScreenContent({
  apiClient,
  tools,
  commands,
  version,
}: {
  apiClient: APIClient
  tools: Tool<any, any, any>[]
  commands: Command[]
  version: string
}) {
  const isProcessing = useAppState((s) => s.isProcessing)
  const messages = useAppState((s) => s.messages)
  const setState = useSetAppState()
  const store = useAppStateStore()

  useEffect(() => {
    const welcome = `\n  ${BRAND.name} v${version} — ${BRAND.tagline}\n  Type /help for commands, /exit to quit\n`
    const sysMsg = {
      id: crypto.randomUUID(),
      role: 'system' as const,
      content: welcome,
      timestamp: Date.now(),
    }
    setState({ messages: [sysMsg] })
  }, [])

  const handleSubmit = useCallback(async (input: string) => {
    const trimmed = input.trim()
    if (!trimmed) return

    if (trimmed === '/exit' || trimmed === '/quit') {
      process.exit(0)
    }

    // Check for slash commands
    if (trimmed.startsWith('/')) {
      const parts = trimmed.slice(1).split(' ')
      const cmdName = parts[0].toLowerCase()
      const cmdArgs = parts.slice(1)

      const command = commands.find(
        (c) => c.name === cmdName || c.aliases?.includes(cmdName)
      )

      if (command?.execute) {
        await command.execute(cmdArgs)
      } else {
        const errMsg = {
          id: crypto.randomUUID(),
          role: 'system' as const,
          content: `Unknown command: /${cmdName}. Type /help for available commands.`,
          timestamp: Date.now(),
        }
        setState({ messages: [...store.getState().messages, errMsg] })
      }
      return
    }

    const userMsg = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content: trimmed,
      timestamp: Date.now(),
    }

    setState({ messages: [...store.getState().messages, userMsg], isProcessing: true })

    await executeQuery({
      messages: [...store.getState().messages, userMsg],
      tools,
      apiClient,
      systemPrompt: SYSTEM_PROMPT,
      store,
    })
  }, [tools, apiClient, commands, store, setState])

  return (
    <Box flexDirection="column" height="100%">
      <Box flexDirection="column" flexGrow={1} marginBottom={1}>
        <MessageList />
      </Box>
      {!isProcessing && <PromptInput onSubmit={handleSubmit} />}
      <StatusLine version={version} />
    </Box>
  )
}
