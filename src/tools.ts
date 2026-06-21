import type { Tool } from './Tool.js'
import type { PermissionContext } from './utils/permissions/permissionSetup.js'
import { BashTool } from './tools/BashTool/BashTool.js'
import { FileReadTool } from './tools/FileReadTool/FileReadTool.js'
import { FileWriteTool } from './tools/FileWriteTool/FileWriteTool.js'
import { FileEditTool } from './tools/FileEditTool/FileEditTool.js'
import { GrepTool } from './tools/GrepTool/GrepTool.js'
import { GlobTool } from './tools/GlobTool/GlobTool.js'
import { WebSearchTool } from './tools/WebSearchTool/WebSearchTool.js'
import { WebFetchTool } from './tools/WebFetchTool/WebFetchTool.js'

export function getAllBaseTools(): Tool<any, any, any>[] {
  return [
    BashTool,
    FileReadTool,
    FileWriteTool,
    FileEditTool,
    GrepTool,
    GlobTool,
    WebSearchTool,
    WebFetchTool,
  ]
}

export function getTools(permissionContext: PermissionContext): Tool<any, any, any>[] {
  let tools = getAllBaseTools()

  if (permissionContext.mode.mode === 'bypassPermissions') {
    // In simple/bypass mode, keep only read-only + bash
    tools = tools.filter((t) => t.isReadOnly() || t.name === 'Bash')
  }

  return tools.filter((t) => t.isEnabled())
}
