export function applyProviderFlag(provider: string): void {
  const p = provider.toLowerCase()

  switch (p) {
    case 'openai':
    case 'openai-compatible':
      process.env.CLAUDE_CODE_USE_OPENAI = '1'
      break
    case 'anthropic':
    case 'claude':
      process.env.CLAUDE_CODE_USE_ANTHROPIC = '1'
      break
    case 'gemini':
    case 'google':
      process.env.CLAUDE_CODE_USE_GEMINI = '1'
      break
    case 'ollama':
      process.env.OPENAI_BASE_URL = 'http://localhost:11434/v1'
      process.env.OPENAI_MODEL = 'qwen2.5-coder:7b'
      break
  }
}
