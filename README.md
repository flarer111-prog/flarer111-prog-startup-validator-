# VentureProof

Evidence-first startup validation. VentureProof stress-tests an idea across demand, problem severity, competition, monetisation, acquisition and risk, while separating heuristic scoring from evidence confidence.

## Production principles

- Never fabricate market evidence.
- A score and confidence are separate signals.
- Missing research credentials produce an explicit evidence-limited state.
- Validation errors are handled with a recoverable UI boundary.
- Secrets belong in Vercel environment variables, never in Git.

## Stack

Next.js · TypeScript · Vercel · Supabase · PostHog · Sentry

## Validation flow

Idea → structured scoring → evidence readiness → verdict → next actions.

The product is intentionally conservative: insufficient evidence is a valid outcome.
