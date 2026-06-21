export type PermissionMode =
  | { mode: 'default' }
  | { mode: 'acceptEdits' }
  | { mode: 'bypassPermissions' }
  | { mode: 'plan' }
  | { mode: 'auto' }
