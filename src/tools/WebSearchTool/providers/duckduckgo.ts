type SearchResult = {
  title: string
  url: string
  snippet: string
}

export async function searchDuckDuckGo(
  query: string,
  numResults: number = 8
): Promise<SearchResult[]> {
  const url = new URL('https://html.duckduckgo.com/html/')
  url.searchParams.set('q', query)

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Codeforge/1.0)',
    },
  })

  if (!response.ok) {
    throw new Error(`DuckDuckGo returned ${response.status}`)
  }

  const html = await response.text()
  const results: SearchResult[] = []

  const resultRegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g

  let match
  while ((match = resultRegex.exec(html)) !== null && results.length < numResults) {
    results.push({
      url: decodeURIComponent(match[1]),
      title: match[2].replace(/<[^>]*>/g, '').trim(),
      snippet: match[3].replace(/<[^>]*>/g, '').trim(),
    })
  }

  return results
}
