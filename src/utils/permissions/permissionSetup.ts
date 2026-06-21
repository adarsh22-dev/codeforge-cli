import type { PermissionMode } from './PermissionMode.js'

export type PermissionContext = {
  mode: PermissionMode
  allowRules: string[]
  denyRules: string[]
}

export function setupPermissions(options: {
  mode?: string
}): PermissionContext {
  let mode: PermissionMode = { mode: 'default' }

  switch (options.mode) {
    case 'bypassPermissions':
    case 'bypass':
      mode = { mode: 'bypassPermissions' }
      break
    case 'acceptEdits':
      mode = { mode: 'acceptEdits' }
      break
    case 'plan':
      mode = { mode: 'plan' }
      break
    case 'auto':
      mode = { mode: 'auto' }
      break
  }

  return {
    mode,
    allowRules: [],
    denyRules: [],
  }
}
