export type HookProgress = {
  type: 'prompt' | 'http' | 'agent'
  status: 'running' | 'success' | 'error'
  message?: string
}

export type PromptRequest = {
  prompt: string
  variables?: Record<string, string>
}

export type PromptResponse = {
  response: string
}
