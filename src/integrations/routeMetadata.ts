export type RouteId =
  | 'anthropic'
  | 'openai-compatible'
  | 'gemini'
  | 'bedrock'
  | 'vertex'
  | 'codex'

export type ResolvedProvider = {
  name: string
  route: RouteId
  baseUrl: string
  apiKey?: string
  model: string
}

export function resolveActiveRouteIdFromEnv(): RouteId {
  if (process.env.CLAUDE_CODE_USE_ANTHROPIC) return 'anthropic'
  if (process.env.CLAUDE_CODE_USE_GEMINI) return 'gemini'
  if (process.env.CLAUDE_CODE_USE_BEDROCK) return 'bedrock'
  if (process.env.CLAUDE_CODE_USE_VERTEX) return 'vertex'
  if (process.env.CLAUDE_CODE_USE_CODEX) return 'codex'
  return 'openai-compatible' // default
}

export function resolveProvider(provider?: string, model?: string): ResolvedProvider {
  const route = provider
    ? providerToRouteId(provider)
    : resolveActiveRouteIdFromEnv()

  switch (route) {
    case 'anthropic':
      return {
        name: 'anthropic',
        route: 'anthropic',
        baseUrl: 'https://api.anthropic.com/v1',
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: model || 'claude-sonnet-4-20250514',
      }
    case 'gemini':
      return {
        name: 'gemini',
        route: 'gemini',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        apiKey: process.env.GEMINI_API_KEY,
        model: model || 'gemini-2.5-flash',
      }
    case 'openai-compatible':
    default:
      return {
        name: 'openai-compatible',
        route: 'openai-compatible',
        baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
        apiKey: process.env.OPENAI_API_KEY,
        model: model || process.env.OPENAI_MODEL || 'gpt-4o',
      }
  }
}

function providerToRouteId(provider: string): RouteId {
  const p = provider.toLowerCase()
  if (p === 'anthropic' || p === 'claude') return 'anthropic'
  if (p === 'gemini' || p === 'google') return 'gemini'
  if (p === 'bedrock' || p === 'aws') return 'bedrock'
  if (p === 'vertex') return 'vertex'
  if (p === 'codex') return 'codex'
  return 'openai-compatible'
}
