import { NextResponse } from 'next/server'
import { demoValidation, scoreEvidence, type Evidence } from '@/lib/validation'
import { researchIdea } from '@/lib/research'

function classify(s: string): { category: string; polarity: Evidence['polarity'] } {
  const t = s.toLowerCase()
  if (/price|pay|cost|revenue|subscription|pricing/.test(t)) return { category: 'monetization', polarity: 'positive' }
  if (/competitor|alternative|market leader|similar/.test(t)) return { category: 'competition', polarity: /dominant|crowded|leader/.test(t) ? 'negative' : 'neutral' }
  if (/complaint|pain|problem|frustrat|need|challenge/.test(t)) return { category: 'problem', polarity: 'positive' }
  if (/demand|search|growing|growth|popular|users|customers|adoption/.test(t)) return { category: 'demand', polarity: 'positive' }
  if (/acquisition|channel|community|distribution|advertis/.test(t)) return { category: 'acquisition', polarity: 'positive' }
  if (/risk|regulat|lawsuit|fraud|privacy|security|dependency/.test(t)) return { category: 'risk', polarity: 'negative' }
  return { category: 'demand', polarity: 'neutral' }
}

export async function POST(req: Request) {
  try {
    const { idea, customer, location } = await req.json()
    if (typeof idea !== 'string' || idea.trim().length < 12 || typeof customer !== 'string' || customer.trim().length < 2) return NextResponse.json({ error: 'Give us a specific startup idea and target customer.' }, { status: 400 })
    const sources = await researchIdea(idea.trim(), `${customer.trim()} ${location || ''}`)
    if (!sources.length) return NextResponse.json({ ...demoValidation(), researchStatus: 'awaiting_provider_credentials', message: 'The scoring engine is live, but live research credentials are not available in this deployment. No market claim is being presented as verified.' })
    const evidence: Evidence[] = sources.map(s => {
      const c = classify(`${s.title} ${s.snippet}`)
      return { category: c.category, claim: s.snippet.slice(0, 500), sourceUrl: s.url, sourceName: s.title, sourceType: s.provider, polarity: c.polarity, strength: 55, excerpt: s.snippet.slice(0, 700), publishedAt: s.publishedAt }
    })
    return NextResponse.json({ ...scoreEvidence(evidence, idea, customer), researchStatus: 'complete' })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Validation failed' }, { status: 500 })
  }
}
