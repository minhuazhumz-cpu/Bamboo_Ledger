# Bamboo Ledger

A rolling-forecast classification training game — same pandas-selling-bamboo world as Bamboo Broker, different lesson. Instead of choosing what percentage to report, you learn *which bucket* a signal belongs in.

## The rule

Every round, the 1,000-stalk round target is explicitly split across three customers (e.g. 400/300/300, or 250/550/200 — it's randomized and always shown up front). Every signal from a customer has a **fixed probability** you cannot adjust; visit and investigate to reveal it, then classify it:

- **Risk ≥ 95%** → **Rolling Forecast** — the original target allocation can't be trusted anymore, so your committed number has to move.
- **Risk 75–95%**, or **any Opportunity at any probability** → **Risk & Opportunity** — real enough to flag, not certain enough to commit. Opportunities never sit in the baseline, so they always land here regardless of likelihood.
- **Risk < 75%** → **Not Significant** — too uncertain to act on. Investigate before you dismiss something this way.

A live Kanban board always shows the Target allocation, the Rolling Forecast against that target, and everything sitting in Risk & Opportunity. After each of the 4 seasonal rounds, a reflection screen grades every decision against the rule, explains why, and shows what actually happened — reinforcing the lesson before the next round.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```
