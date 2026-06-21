import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

export type MCPServerConfig = {
  command: string
  args?: string[]
  env?: Record<string, string>
}

export type MCPConnection = {
  client: Client
  tools: any[]
  resources: any[]
}

export async function connectMCPServer(config: MCPServerConfig): Promise<MCPConnection> {
  const transport = new StdioClientTransport({
    command: config.command,
    args: config.args || [],
    env: config.env,
  })

  const client = new Client(
    { name: 'codeforge', version: '1.0.0' },
    { capabilities: {} }
  )

  await client.connect(transport)

  const toolsResult = await client.listTools()
  const resourcesResult = await client.listResources()

  return {
    client,
    tools: toolsResult.tools || [],
    resources: resourcesResult.resources || [],
  }
}
