import type { APIClient, StreamEvent } from './services/api/client.js'
import type { Tool, ToolUseContext } from './Tool.js'
import type { Message, ContentBlock } from './types/message.js'
import type { Store } from './state/store.js'
import type { AppState } from './state/AppState.js'

export type Terminal = 'end_turn' | 'error' | 'max_tokens' | 'cancelled'

export type QueryParams = {
  messages: Message[]
  tools: Tool<any, any, any>[]
  apiClient: APIClient
  systemPrompt: string
  store: Store<AppState>
  signal?: AbortSignal
  onEvent?: (event: StreamEvent) => void
}

export type QueryResult = {
  terminal: Terminal
  messages: Message[]
  error?: string
}

export async function executeQuery(params: QueryParams): Promise<QueryResult> {
  const { messages, tools, apiClient, systemPrompt, store, signal, onEvent } = params
  const state = { messages: [...messages] }

  while (true) {
    store.setState({ isProcessing: true, isStreaming: true })

    const toolContext: ToolUseContext = {
      getAppState: () => store.getState(),
      setAppState: (partial) => store.setState(partial),
      abortController: new AbortController(),
      options: {
        model: store.getState().model,
        provider: store.getState().provider,
      },
    }

    let fullText = ''
    const toolCalls: { id: string; name: string; input: Record<string, unknown> }[] = []

    try {
      for await (const event of apiClient.callModel(
        state.messages,
        tools,
        systemPrompt,
        signal
      )) {
        onEvent?.(event)

        switch (event.type) {
          case 'text':
            fullText += event.content
            store.setState({ currentStreamedText: fullText })
            break

          case 'tool_use':
            toolCalls.push({ id: event.id, name: event.name, input: event.input })
            break

          case 'error':
            store.setState({ isProcessing: false, isStreaming: false, error: event.error })
            const errMsg: Message = {
              id: crypto.randomUUID(),
              role: 'system',
              content: `Error: ${event.error}`,
              timestamp: Date.now(),
            }
            return { terminal: 'error', messages: [...state.messages, errMsg], error: event.error }

          case 'done':
            break
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { terminal: 'cancelled', messages: state.messages }
      }
      const errMsg: Message = {
        id: crypto.randomUUID(),
        role: 'system',
        content: `Connection error: ${err.message}. Check your API key and network.`,
        timestamp: Date.now(),
      }
      store.setState({ isProcessing: false, isStreaming: false, error: err.message, messages: [...state.messages, errMsg] })
      return { terminal: 'error', messages: [...state.messages, errMsg], error: err.message }
    }

    if (toolCalls.length === 0) {
      if (fullText) {
        state.messages.push({
          id: crypto.randomUUID(),
          role: 'assistant',
          content: fullText,
          timestamp: Date.now(),
        })
        store.setState({
          messages: state.messages,
          isProcessing: false,
          isStreaming: false,
          currentStreamedText: '',
          error: null,
        })
      } else {
        store.setState({ isProcessing: false, isStreaming: false })
      }
      return { terminal: 'end_turn', messages: state.messages }
    }

    const contentBlocks: ContentBlock[] = []
    if (fullText) {
      contentBlocks.push({ type: 'text', text: fullText })
    }
    for (const tc of toolCalls) {
      contentBlocks.push({ type: 'tool_use', id: tc.id, name: tc.name, input: tc.input })
    }

    state.messages.push({
      id: crypto.randomUUID(),
      role: 'assistant',
      content: contentBlocks,
      timestamp: Date.now(),
    })

    store.setState({ messages: state.messages, currentStreamedText: '' })

    for (const tc of toolCalls) {
      const tool = tools.find((t) => t.name === tc.name)
      if (!tool) {
        state.messages.push({
          id: crypto.randomUUID(),
          role: 'tool_result',
          content: `Error: tool "${tc.name}" not found`,
          timestamp: Date.now(),
          toolCallId: tc.id,
          toolName: tc.name,
        })
        continue
      }

      const validation = tool.validateInput(tc.input as any)
      if (!validation.result) {
        state.messages.push({
          id: crypto.randomUUID(),
          role: 'tool_result',
          content: `Validation error: ${validation.message}`,
          timestamp: Date.now(),
          toolCallId: tc.id,
          toolName: tc.name,
        })
        continue
      }

      const permission = await tool.checkPermissions(tc.input as any, toolContext)
      if (!permission.allowed) {
        state.messages.push({
          id: crypto.randomUUID(),
          role: 'tool_result',
          content: `Permission denied: ${permission.reason}`,
          timestamp: Date.now(),
          toolCallId: tc.id,
          toolName: tc.name,
        })
        continue
      }

      store.setState({
        toolProgress: { ...store.getState().toolProgress, [tc.id]: `Running ${tc.name}...` },
      })

      const result = await tool.call(tc.input as any, toolContext, (progress) => {
        store.setState({
          toolProgress: {
            ...store.getState().toolProgress,
            [tc.id]: JSON.stringify(progress),
          },
        })
      })

      const resultContent = result.type === 'success'
        ? (typeof result.output === 'string' ? result.output : JSON.stringify(result.output))
        : result.error || ''

      state.messages.push({
        id: crypto.randomUUID(),
        role: 'tool_result',
        content: resultContent,
        timestamp: Date.now(),
        toolCallId: tc.id,
        toolName: tc.name,
      })

      const newProgress = { ...store.getState().toolProgress }
      delete newProgress[tc.id]
      store.setState({ toolProgress: newProgress })
    }

    store.setState({ messages: state.messages })
  }
}
