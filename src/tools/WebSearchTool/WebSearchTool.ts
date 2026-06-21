import { z } from 'zod'
import { buildTool } from '../../Tool.js'
import { searchDuckDuckGo } from './providers/duckduckgo.js'

const WebSearchInput = z.object({
  query: z.string().describe('Search query'),
  numResults: z.number().optional().describe('Number of results (default: 8)'),
})

type WebSearchInput = z.infer<typeof WebSearchInput>

type SearchResult = {
  title: string
  url: string
  snippet: string
}

type WebSearchOutput = {
  results: SearchResult[]
  total: number
}

export const WebSearchTool = buildTool<WebSearchInput, WebSearchOutput>({
  name: 'WebSearch',
  inputSchema: WebSearchInput,
  userFacingName: 'WebSearch',

  description: (input) => `Search the web for: ${input.query}`,

  prompt: () => `## WebSearch
Search the web for current information. Uses DuckDuckGo by default.
Returns titles, URLs, and snippets.`,

  isReadOnly: () => true,
  isDestructive: () => false,

  call: async (input) => {
    try {
      const results = await searchDuckDuckGo(input.query, input.numResults || 8)
      return {
        type: 'success',
        output: { results, total: results.length },
      }
    } catch (err: any) {
      return { type: 'error', error: `Web search failed: ${err.message}` }
    }
  },
})
