export function getAnthropicApiKey(): string | undefined {
  return process.env.ANTHROPIC_API_KEY
}

export function getOpenAIApiKey(): string | undefined {
  return process.env.OPENAI_API_KEY
}

export function getGeminiApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY
}

export function getGitHubToken(): string | undefined {
  return process.env.GITHUB_TOKEN
}
