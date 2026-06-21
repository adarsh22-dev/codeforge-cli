export type PermissionMode = {
  mode: 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan' | 'auto'
}

export type PermissionResult =
  | { allowed: true }
  | { allowed: false; reason: string; askUser?: boolean }

export type PermissionRule = {
  effect: 'allow' | 'deny' | 'ask'
  tool: string
  pattern?: string
  reason?: string
}

export type AdditionalWorkingDirectory = {
  path: string
  label?: string
}
