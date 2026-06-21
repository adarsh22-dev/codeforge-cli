import { z } from 'zod'
import { buildTool } from '../../Tool.js'

const WebFetchInput = z.object({
  url: z.string().url().describe('URL to fetch content from'),
  format: z.enum(['markdown', 'text', 'html']).optional().describe('Output format'),
})

type WebFetchInput = z.infer<typeof WebFetchInput>

type WebFetchOutput = {
  content: string
  format: string
  url: string
}

export const WebFetchTool = buildTool<WebFetchInput, WebFetchOutput>({
  name: 'WebFetch',
  inputSchema: WebFetchInput,
  userFacingName: 'WebFetch',

  description: (input) => `Fetch URL: ${input.url}`,

  prompt: () => `## WebFetch
Fetch content from a URL. Returns the content in the requested format.
Useful for reading documentation, articles, and API responses.`,

  isReadOnly: () => true,
  isDestructive: () => false,

  validateInput: (input) => {
    try {
      new URL(input.url)
      return { result: true }
    } catch {
      return { result: false, message: 'Invalid URL', errorCode: 1 }
    }
  },

  call: async (input) => {
    try {
      const response = await fetch(input.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Codeforge/1.0)',
        },
        signal: AbortSignal.timeout(15_000),
      })

      if (!response.ok) {
        return { type: 'error', error: `HTTP ${response.status}: ${response.statusText}` }
      }

      const contentType = response.headers.get('content-type') || ''
      let content: string

      if (contentType.includes('application/json')) {
        const json = await response.json()
        content = JSON.stringify(json, null, 2)
      } else {
        content = await response.text()
      }

      // Simple HTML-to-text conversion for markdown format
      if (input.format === 'markdown' || !input.format) {
        content = htmlToBasicMarkdown(content)
      }

      return {
        type: 'success',
        output: { content, format: input.format || 'markdown', url: input.url },
      }
    } catch (err: any) {
      if (err.name === 'TimeoutError') {
        return { type: 'error', error: 'Request timed out' }
      }
      return { type: 'error', error: `Fetch failed: ${err.message}` }
    }
  },
})

function htmlToBasicMarkdown(html: string): string {
  return html
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '# $1\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '## $1\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '### $1\n')
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '#### $1\n')
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*')
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`')
    .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, '```\n$1\n```\n')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n')
    .replace(/<[^>]*>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
