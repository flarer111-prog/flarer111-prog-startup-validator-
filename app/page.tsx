'use client';

import { FormEvent, useMemo, useState } from 'react';

type Dimension = { name: string; score: number; rationale: string };
type Result = { decision: 'BUILD' | 'PIVOT' | 'KILL' | 'INSUFFICIENT EVIDENCE'; score: number; confidence: number; summary: string; dimensions: Dimension[]; nextSteps: string[]; evidenceStatus: string };

const examples = [
  'AI bookkeeping for small businesses in Kenya',
  'A marketplace connecting university students with verified tutors',
  'A WhatsApp-based inventory system for small retailers',
];

export default function Home() {
  const [idea, setIdea] = useState('');
  const [audience, setAudience] = useState('');
  const [location, setLocation] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = useMemo(() => idea.trim().length >= 12 && !loading, [idea, loading]);

  async function validate(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const response = await fetch('/api/validate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ idea, audience, location }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Validation failed.');
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally { setLoading(false); }
  }

  const decisionClass = result?.decision.toLowerCase().replaceAll(' ', '-') ?? '';

  return (
    <main className="shell">
      <nav className="nav"><div className="brand"><span className="brand-mark">V</span><span>VentureProof</span></div><span className="nav-pill">Evidence-first startup intelligence</span></nav>
      <section className="hero">
        <div className="eyebrow">◆ BUILD WITH EVIDENCE, NOT HYPE</div>
        <h1>Know what your startup<br /><em>should do next.</em></h1>
        <p className="hero-copy">Stress-test an idea against demand, customer pain, competition, monetisation and execution risk — then get a decision you can act on.</p>
      </section>

      <section className="workspace">
        <form className="card intake" onSubmit={validate}>
          <div className="card-head"><div><span className="step">01</span><h2>Describe the venture</h2></div><span className="live-dot">● LIVE ENGINE</span></div>
          <label>What are you building?<textarea value={idea} onChange={e => setIdea(e.target.value)} placeholder="Example: A platform that helps small retailers predict stock-outs and reorder inventory..." maxLength={1000} /></label>
          <div className="two-col">
            <label>Target customer<input value={audience} onChange={e => setAudience(e.target.value)} placeholder="e.g. small retailers" /></label>
            <label>Market / geography<input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Kenya, East Africa" /></label>
          </div>
          <div className="examples"><span>Try an idea:</span>{examples.map(x => <button type="button" key={x} onClick={() => setIdea(x)}>{x}</button>)}</div>
          <button className="primary" disabled={!canSubmit}>{loading ? <><span className="spinner" /> Researching signal...</> : <>Validate my venture <span>→</span></>}</button>
          <p className="disclaimer">A preliminary score is never presented as market truth. Evidence availability and confidence are shown separately.</p>
        </form>

        <section className="card results" aria-live="polite">
          {!result && !loading && !error && <div className="empty"><div className="orb">✦</div><h2>Your decision appears here</h2><p>Submit an idea to generate a transparent scorecard. Every dimension is designed to be challenged by evidence.</p><div className="signal-grid"><span>Demand</span><span>Problem</span><span>Competition</span><span>Monetisation</span><span>Acquisition</span><span>Risk</span></div></div>}
          {loading && <div className="empty loading-state"><div className="loader-ring" /><h2>Stress-testing your idea</h2><p>Checking the venture logic and preparing an evidence-ready scorecard.</p></div>}
          {error && <div className="empty"><div className="error-icon">!</div><h2>We hit a snag</h2><p>{error}</p><button className="secondary" onClick={() => setError('')}>Try again</button></div>}
          {result && <div className="result-body">
            <div className="result-top"><div><span className="step">02</span><h2>Validation verdict</h2></div><span className={`decision ${decisionClass}`}>{result.decision}</span></div>
            <div className="score-row"><div className="score"><strong>{result.score}</strong><span>/100</span></div><div className="summary"><strong>{result.summary}</strong><p>Confidence <b>{result.confidence}%</b> · {result.evidenceStatus}</p></div></div>
            <div className="dimensions">{result.dimensions.map(d => <div className="dimension" key={d.name}><div className="dim-head"><span>{d.name}</span><b>{d.score}</b></div><div className="bar"><i style={{ width: `${d.score}%` }} /></div><p>{d.rationale}</p></div>)}</div>
            <div className="next"><div><span className="step">03</span><h3>Do this next</h3></div>{result.nextSteps.map((s, i) => <div className="next-item" key={s}><span>{String(i + 1).padStart(2, '0')}</span>{s}</div>)}</div>
            <button className="secondary" onClick={() => { setResult(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Test another venture</button>
          </div>}
        </section>
      </section>
      <footer><span>VENTUREPROOF</span><span>Evidence over enthusiasm.</span><span>Private MVP · 2026</span></footer>
    </main>
  );
}
