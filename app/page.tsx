'use client';

import { FormEvent, useState } from 'react';

type Result = { score: number; verdict: string; demand: string; competition: string; monetization: string; summary: string; nextSteps: string[] };

export default function Home() {
  const [idea, setIdea] = useState('');
  const [customer, setCustomer] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault(); setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/validate', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ idea, customer }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Validation failed');
      setResult(data);
    } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong'); }
    finally { setLoading(false); }
  }

  return <main className="shell">
    <section className="hero"><div className="eyebrow">Evidence before execution</div><h1>Should this startup exist?</h1><p>Turn a startup idea into a structured validation report. The MVP begins with a transparent scoring engine and is designed to add live market evidence from our research stack next.</p></section>
    <section className="panel"><form className="form" onSubmit={submit}>
      <label className="label">Startup idea<textarea className="textarea" required value={idea} onChange={e=>setIdea(e.target.value)} placeholder="Describe what you want to build, who it helps, and why it matters." /></label>
      <label className="label">Target customer<input className="input" required value={customer} onChange={e=>setCustomer(e.target.value)} placeholder="e.g. small Kenyan retailers" /></label>
      <button className="button" disabled={loading}>{loading ? 'Validating…' : 'Validate idea'}</button>
    </form>
    {error && <p className="error">{error}</p>}
    {result && <div className="result"><div><div className="eyebrow">Initial validation</div><div className="score">{result.score}/100</div><strong>{result.verdict}</strong><p>{result.summary}</p></div><div className="grid"><div className="metric"><small>Demand signal</small><strong>{result.demand}</strong></div><div className="metric"><small>Competition</small><strong>{result.competition}</strong></div><div className="metric"><small>Monetization</small><strong>{result.monetization}</strong></div></div><div className="metric"><small>Next validation steps</small><ul>{result.nextSteps.map((x,i)=><li key={i}>{x}</li>)}</ul></div></div>}
    </section>
  </main>;
}
