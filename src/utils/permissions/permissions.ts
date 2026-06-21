import type { PermissionMode } from './PermissionMode.js'

export type PermitResult = {
  allowed: boolean
  reason?: string
  askUser?: boolean
}

export function checkPermission(
  tool: string,
  action: string,
  mode: PermissionMode
): PermitResult {
  if (mode.mode === 'bypassPermissions') {
    return { allowed: true }
  }

  if (mode.mode === 'plan') {
    return { allowed: false, reason: 'Planning mode — no execution allowed' }
  }

  if (mode.mode === 'auto') {
    return classifyAction(tool, action)
  }

  if (mode.mode === 'default') {
    const destructiveTools = ['Bash', 'FileWrite', 'FileEdit']
    if (destructiveTools.includes(tool)) {
      return { allowed: true, askUser: true }
    }
    return { allowed: true }
  }

  return { allowed: false, reason: 'No matching permission rule' }
}

function classifyAction(tool: string, action: string): PermitResult {
  const readOnlyTools = ['FileRead', 'Grep', 'Glob', 'WebSearch', 'WebFetch']
  if (readOnlyTools.includes(tool)) {
    return { allowed: true }
  }

  return { allowed: true }
}
