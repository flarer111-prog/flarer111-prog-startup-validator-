export type ResearchSource = { title: string; url: string; snippet: string; provider: string; publishedAt?: string }
const env = (x: string) => process.env[x]

async function post(url: string, body: unknown, headers: Record<string,string> = {}) {
  const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body), cache: 'no-store' })
  if (!r.ok) throw new Error(String(r.status))
  return r.json()
}

export async function researchIdea(idea: string, customer: string) {
  const q = `${idea} ${customer} demand customers competitors pricing complaints alternatives market`
  const out: ResearchSource[] = []
  if (env('EXA_API_KEY')) {
    try {
      const x = await post('https://api.exa.ai/search', { query: q, numResults: 10, contents: { highlights: { maxCharacters: 900 } } }, { 'x-api-key': env('EXA_API_KEY')! })
      for (const r of x.results || []) out.push({ title: r.title, url: r.url, snippet: (r.highlights || []).join(' '), provider: 'exa', publishedAt: r.publishedDate })
    } catch {}
  }
  if (env('TAVILY_API_KEY')) {
    try {
      const x = await post('https://api.tavily.com/search', { api_key: env('TAVILY_API_KEY'), query: q, max_results: 10, search_depth: 'advanced' })
      for (const r of x.results || []) out.push({ title: r.title, url: r.url, snippet: r.content || '', provider: 'tavily', publishedAt: r.published_date })
    } catch {}
  }
  const seen = new Set<string>()
  return out.filter(x => x.url && !seen.has(x.url) && seen.add(x.url)).slice(0, 20)
}
