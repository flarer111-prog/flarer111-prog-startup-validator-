export type Verdict = 'BUILD' | 'PIVOT' | 'PAUSE' | 'INSUFFICIENT_EVIDENCE'
export type Polarity = 'positive' | 'negative' | 'neutral' | 'mixed'

export type Evidence = {
  category: string
  claim: string
  sourceUrl?: string
  sourceName?: string
  sourceType?: string
  polarity: Polarity
  strength: number
  excerpt?: string
  publishedAt?: string
}

export type Dimension = {
  name: string
  score: number
  rationale: string
  strengths: string[]
  weaknesses: string[]
  improvements: string[]
}

export type Improvement = {
  problem: string
  change: string
  whyItCouldHelp: string
  evidence: Evidence[]
  expectedImpact: { dimension: string; from: number; to: number; reason: string }[]
}

export type Result = {
  verdict: Verdict
  score: number
  confidence: number
  evidenceStatus: string
  summary: string
  dimensions: Dimension[]
  strengths: string[]
  weaknesses: string[]
  improvements: Improvement[]
  evidence: Evidence[]
  nextSteps: string[]
}

const clamp = (n: number) => Math.max(0, Math.min(100, n))

function categoryScore(evidence: Evidence[], category: string, baseline = 50) {
  const items = evidence.filter(e => e.category === category)
  if (!items.length) return baseline
  const weighted = items.reduce((sum, e) => sum + e.strength * (e.polarity === 'negative' ? -0.55 : e.polarity === 'positive' ? 1 : 0), 0)
  return clamp(Math.round(baseline + weighted / Math.max(1, items.length)))
}

export function scoreEvidence(evidence: Evidence[], idea = '', customer = ''): Result {
  const demand = categoryScore(evidence, 'demand', 45)
  const problem = categoryScore(evidence, 'problem', 45)
  const competition = clamp(100 - categoryScore(evidence, 'competition', 45))
  const monetization = categoryScore(evidence, 'monetization', 45)
  const acquisition = categoryScore(evidence, 'acquisition', 45)
  const risk = clamp(100 - categoryScore(evidence, 'risk', 45))
  const dimensions: Dimension[] = [
    { name: 'Demand', score: demand, rationale: demand >= 65 ? 'Multiple signals indicate meaningful demand.' : 'Demand is not yet strongly demonstrated by the available evidence.', strengths: demand >= 65 ? ['Demand signals are visible in the evidence set.'] : [], weaknesses: demand < 65 ? ['Demand evidence is too weak or mixed.'] : [], improvements: ['Test the highest-intent customer segment with a concrete offer.'] },
    { name: 'Problem', score: problem, rationale: problem >= 65 ? 'The problem shows signs of being real and consequential.' : 'The problem still needs stronger proof of frequency and severity.', strengths: problem >= 65 ? ['Observed pain signals support the problem.'] : [], weaknesses: problem < 65 ? ['Pain severity is not sufficiently established.'] : [], improvements: ['Collect direct customer evidence and quantify frequency, cost and urgency.'] },
    { name: 'Competition', score: competition, rationale: competition >= 65 ? 'There appears to be room to differentiate.' : 'Competition or substitutes may make differentiation difficult.', strengths: competition >= 65 ? ['Potential differentiation exists.'] : [], weaknesses: competition < 65 ? ['Existing alternatives may be strong.'] : [], improvements: ['Choose one underserved segment and define a measurable wedge.'] },
    { name: 'Monetization', score: monetization, rationale: monetization >= 65 ? 'There are credible monetization signals.' : 'Willingness to pay is not sufficiently demonstrated.', strengths: monetization >= 65 ? ['Monetization signals are present.'] : [], weaknesses: monetization < 65 ? ['Pricing or willingness-to-pay remains uncertain.'] : [], improvements: ['Run a pricing/commitment test before building deeply.'] },
    { name: 'Acquisition', score: acquisition, rationale: acquisition >= 65 ? 'A plausible route to customers is visible.' : 'Customer acquisition remains an important uncertainty.', strengths: acquisition >= 65 ? ['A reachable customer channel is visible.'] : [], weaknesses: acquisition < 65 ? ['The first-customer path is unclear or expensive.'] : [], improvements: ['Design a first-100-customer channel around the highest-intent audience.'] },
    { name: 'Risk', score: risk, rationale: risk >= 65 ? 'No dominant structural risk is evident in the current evidence.' : 'Material risks need mitigation before significant investment.', strengths: risk >= 65 ? ['No dominant risk signal found.'] : [], weaknesses: risk < 65 ? ['Material risk signals need mitigation.'] : [], improvements: ['Turn the highest-impact risk into a validation experiment.'] }
  ]
  const score = Math.round(dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length)
  const uniqueSources = new Set(evidence.map(e => e.sourceUrl || e.sourceName || e.sourceType)).size
  const confidence = clamp(Math.round(25 + Math.min(50, evidence.length * 3) + Math.min(20, uniqueSources * 4)))
  const evidenceStatus = evidence.length >= 10 ? 'Evidence set is substantial; review source quality and contradictions.' : evidence.length ? 'Preliminary evidence; more independent sources are needed.' : 'No live evidence was retrieved.'
  const weakest = [...dimensions].sort((a,b) => a.score-b.score)[0]
  const strongest = [...dimensions].sort((a,b) => b.score-a.score)[0]
  const verdict: Verdict = confidence < 45 ? 'INSUFFICIENT_EVIDENCE' : score >= 72 ? 'BUILD' : score >= 52 ? 'PIVOT' : 'PAUSE'
  const summary = verdict === 'BUILD' ? 'The evidence supports focused validation and a narrow build.' : verdict === 'PIVOT' ? `The opportunity has signals, but ${weakest.name.toLowerCase()} needs a stronger angle before major investment.` : verdict === 'PAUSE' ? 'Do not abandon the dream. Fix the weakest assumptions, then retest with evidence.' : 'There is not enough independent evidence to justify a strong conclusion yet.'
  const improvements: Improvement[] = [{
    problem: `${weakest.name} is currently the biggest constraint.`,
    change: `Redesign the offer around the strongest defensible signal in ${strongest.name.toLowerCase()}, while directly testing ${weakest.name.toLowerCase()}.`,
    whyItCouldHelp: `A focused change should concentrate resources on the strongest evidence and turn the weakest assumption into a measurable experiment.`,
    evidence: evidence.filter(e => e.category === weakest.name.toLowerCase()).slice(0, 4),
    expectedImpact: dimensions.filter(d => d.name === weakest.name || d.name === strongest.name).map(d => ({ dimension: d.name, from: d.score, to: clamp(d.score + (d.name === weakest.name ? 15 : 7)), reason: 'Targeted validation and clearer positioning could improve the signal; the change is a hypothesis, not a guarantee.' }))
  }]
  return {
    verdict, score, confidence, evidenceStatus, summary, dimensions,
    strengths: dimensions.filter(d => d.score >= 65).flatMap(d => d.strengths).slice(0, 8),
    weaknesses: dimensions.filter(d => d.score < 65).flatMap(d => d.weaknesses).slice(0, 8),
    improvements, evidence,
    nextSteps: [`Validate ${weakest.name.toLowerCase()} with 10-20 target customers.`, 'Run a concrete willingness-to-pay or commitment test.', 'Retest the idea after the change and compare evidence, score and confidence.']
  }
}

export function demoValidation(): Result {
  return scoreEvidence([
    { category: 'problem', claim: 'Problem evidence is not yet independently verified.', polarity: 'neutral', strength: 35, sourceType: 'baseline' },
    { category: 'demand', claim: 'Live demand evidence is not yet verified.', polarity: 'neutral', strength: 30, sourceType: 'baseline' },
    { category: 'competition', claim: 'Competitive landscape is not yet mapped.', polarity: 'neutral', strength: 45, sourceType: 'baseline' },
    { category: 'monetization', claim: 'Willingness to pay is not yet tested.', polarity: 'neutral', strength: 30, sourceType: 'baseline' },
    { category: 'acquisition', claim: 'Acquisition economics are not yet verified.', polarity: 'neutral', strength: 30, sourceType: 'baseline' },
    { category: 'risk', claim: 'Structural risks are not yet researched.', polarity: 'neutral', strength: 40, sourceType: 'baseline' }
  ])
}
