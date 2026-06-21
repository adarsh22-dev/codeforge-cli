import type { ResolvedProvider } from '../../integrations/routeMetadata.js'
import type { Tool } from '../../Tool.js'
import type { Message } from '../../types/message.js'

export type StreamEvent =
  | { type: 'text'; content: string }
  | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'error'; error: string }
  | { type: 'done' }

export interface APIClient {
  callModel(
    messages: Message[],
    tools: Tool<any, any, any>[],
    systemPrompt: string,
    signal?: AbortSignal
  ): AsyncGenerator<StreamEvent>
}

export function createAPIClient(provider: ResolvedProvider): APIClient {
  switch (provider.route) {
    case 'anthropic':
      return createAnthropicClient(provider)
    case 'gemini':
      return createGeminiClient(provider)
    default:
      return createOpenAICompatibleClient(provider)
  }
}

function createOpenAICompatibleClient(provider: ResolvedProvider): APIClient {
  return {
    async *callModel(messages, tools, systemPrompt, signal) {
      const body: Record<string, unknown> = {
        model: provider.model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map((m) => ({
            role: m.role === 'tool_result' ? 'tool' : m.role,
            content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
            ...(m.toolCallId ? { tool_call_id: m.toolCallId } : {}),
          })),
        ],
        stream: true,
        max_tokens: 8192,
      }

      if (tools.length > 0) {
        body.tools = tools.map((t) => ({
          type: 'function',
          function: {
            name: t.name,
            description: t.prompt().slice(0, 1024),
            parameters: t.inputSchema,
          },
        }))
      }

      const response = await fetch(`${provider.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(provider.apiKey ? { Authorization: `Bearer ${provider.apiKey}` } : {}),
        },
        body: JSON.stringify(body),
        signal,
      })

      if (!response.ok) {
        const errText = await response.text().catch(() => '')
        yield { type: 'error', error: `API error ${response.status}: ${errText}` }
        yield { type: 'done' }
        return
      }

      const reader = response.body?.getReader()
      if (!reader) {
        yield { type: 'error', error: 'No response body' }
        yield { type: 'done' }
        return
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const parsed = parseSSELine(line)
          if (!parsed) continue

          const delta = parsed.choices?.[0]?.delta
          if (delta?.content) {
            yield { type: 'text', content: delta.content }
          }

          if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
              if (tc.function?.name) {
                yield {
                  type: 'tool_use',
                  id: tc.id,
                  name: tc.function.name,
                  input: JSON.parse(tc.function.arguments || '{}'),
                }
              }
            }
          }
        }
      }

      // Handle remaining buffer
      if (buffer.trim()) {
        const parsed = parseSSELine(buffer.trim())
        if (parsed) {
          const delta = parsed.choices?.[0]?.delta
          if (delta?.content) {
            yield { type: 'text', content: delta.content }
          }
        }
      }

      yield { type: 'done' }
    },
  }
}

function createAnthropicClient(provider: ResolvedProvider): APIClient {
  return {
    async *callModel(messages, tools, systemPrompt, signal) {
      const body: Record<string, unknown> = {
        model: provider.model,
        system: systemPrompt,
        messages: messages.map((m) => ({
          role: m.role === 'tool_result' ? 'user' : m.role,
          content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
        })),
        max_tokens: 8192,
        stream: true,
      }

      if (tools.length > 0) {
        body.tools = tools.map((t) => ({
          name: t.name,
          description: t.prompt().slice(0, 1024),
          input_schema: t.inputSchema,
        }))
      }

      const response = await fetch(`${provider.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': provider.apiKey || '',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
        signal,
      })

      if (!response.ok) {
        const errText = await response.text().catch(() => '')
        yield { type: 'error', error: `Anthropic API error ${response.status}: ${errText}` }
        yield { type: 'done' }
        return
      }

      const reader = response.body?.getReader()
      if (!reader) {
        yield { type: 'error', error: 'No response body' }
        yield { type: 'done' }
        return
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data)

            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              yield { type: 'text', content: parsed.delta.text }
            }

            if (parsed.type === 'content_block_start' && parsed.content_block?.type === 'tool_use') {
              yield {
                type: 'tool_use',
                id: parsed.content_block.id,
                name: parsed.content_block.name,
                input: parsed.content_block.input || {},
              }
            }
          } catch {
            // Skip unparseable events
          }
        }
      }

      yield { type: 'done' }
    },
  }
}

function createGeminiClient(provider: ResolvedProvider): APIClient {
  return {
    async *callModel(messages, tools, systemPrompt, signal) {
      const contents = messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }],
      }))

      const url = `${provider.baseUrl}/models/${provider.model}:streamGenerateContent?alt=sse&key=${provider.apiKey}`

      const body: Record<string, unknown> = {
        contents,
        systemInstruction: { parts: [{ text: systemPrompt }] },
      }

      if (tools.length > 0) {
        body.tools = tools.map((t) => ({
          functionDeclarations: [{
            name: t.name,
            description: t.prompt().slice(0, 1024),
            parameters: t.inputSchema,
          }],
        }))
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal,
      })

      if (!response.ok) {
        const errText = await response.text().catch(() => '')
        yield { type: 'error', error: `Gemini error ${response.status}: ${errText}` }
        yield { type: 'done' }
        return
      }

      const reader = response.body?.getReader()
      if (!reader) {
        yield { type: 'error', error: 'No response body' }
        yield { type: 'done' }
        return
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (!data) continue

          try {
            const parsed = JSON.parse(data)
            const candidate = parsed.candidates?.[0]
            const part = candidate?.content?.parts?.[0]

            if (part?.text) {
              yield { type: 'text', content: part.text }
            }

            if (part?.functionCall) {
              yield {
                type: 'tool_use',
                id: `fc_${Date.now()}`,
                name: part.functionCall.name,
                input: part.functionCall.args || {},
              }
            }
          } catch {
            // Skip unparseable events
          }
        }
      }

      yield { type: 'done' }
    },
  }
}

function parseSSELine(line: string): any {
  const trimmed = line.trim()
  if (!trimmed.startsWith('data: ')) return null
  const data = trimmed.slice(6).trim()
  if (data === '[DONE]') return null
  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}
