---
status: testing
phase: 06-sales-dashboard
source: [06-VERIFICATION.md]
started: 2026-09-17T18:05:00Z
updated: 2026-09-17T18:05:00Z
---

## Current Test

number: 1
name: Unit Sales Target gauge visual fill
expected: |
  The gauge's colored arc visually fills roughly to computeUnitTargetPct(actual, target) * 100% of
  the semicircle sweep — not always fully filled (this was the pre-fix CR-01 bug) — and switching
  between Pipeline/Forecast/Dashboard tabs preserves each tab's state without remounting.
awaiting: user response

## Tests

### 1. Unit Sales Target gauge visual fill
expected: Open the app (`npm run dev`), click the Dashboard tab, and visually confirm the gauge's
  radial ring fill level now visibly tracks actual/target (partial fill, not always-full).
result: [pending]

### 2. Remaining 4 widgets' rendered appearance
expected: Visually inspect the Target vs. Actual Sales chart, Owner Leaderboard, Conversion Rate
  funnel (5-step color ramp, monotonic-or-flat percentages), and the stacked Closed Deals by Owner
  chart (5-color legend wrapping, 12-month x-axis tick legibility) against the real 150-deal seed
  dataset — no dual-axis artifacts, no clipped legend, no overlapping labels.
result: [pending]

## Summary

total: 2
passed: 0
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps
