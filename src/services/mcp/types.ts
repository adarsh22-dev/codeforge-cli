export type MCPServerConnection = {
  name: string
  command: string
  status: 'connected' | 'disconnected' | 'error'
  tools: MCPTool[]
  resources: MCPResource[]
  error?: string
}

export type MCPTool = {
  name: string
  description?: string
  inputSchema?: Record<string, unknown>
}

export type MCPResource = {
  uri: string
  name: string
  description?: string
}
