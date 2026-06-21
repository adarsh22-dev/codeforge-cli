export type BashProgress = {
  type: 'stdout' | 'stderr' | 'exit'
  data?: string
  code?: number
}

export type FileProgress = {
  type: 'reading' | 'writing' | 'editing' | 'done'
  path?: string
  bytes?: number
}

export type SearchProgress = {
  type: 'searching' | 'found' | 'done'
  matches?: number
}

export type ToolProgressData =
  | BashProgress
  | FileProgress
  | SearchProgress
  | { type: 'generic'; message: string }
