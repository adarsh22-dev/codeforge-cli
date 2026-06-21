export type MessageRole = 'user' | 'assistant' | 'system' | 'tool_result'

export type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'tool_result'; tool_use_id: string; content: string }

export type Message = {
  id: string
  role: MessageRole
  content: string | ContentBlock[]
  timestamp: number
  toolCallId?: string
  toolName?: string
}

export type AssistantMessage = Message & { role: 'assistant' }
export type UserMessage = Message & { role: 'user' }
export type SystemMessage = Message & { role: 'system' }
export type ToolResultMessage = Message & { role: 'tool_result' }
