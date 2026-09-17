# Phase 6: Sales Dashboard - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-17
**Phase:** 6-Sales Dashboard
**Areas discussed:** Sales rep roster & data volume, Historical close-date data

---

## Sales Rep Roster & Data Volume

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed roster (recommended) | Add ~5-8 named reps; assign each seeded deal an owner from that fixed list instead of a fresh faker name | ✓ |
| Keep random per-deal names | No change to owner generation | |
| You decide | Claude picks based on what makes the widgets look best | |

**User's choice:** Fixed roster

| Option | Description | Selected |
|--------|-------------|----------|
| 5 reps (recommended) | Small enough for a clean Leaderboard and manageable stacked-bar color segments; ~8 deals/rep avg with 40 deals | ✓ |
| 8 reps | More realistic team size, but some reps may end up with 0 won deals at current volume | |
| You decide | Claude picks a roster size during planning | |

**User's choice:** 5 reps

| Option | Description | Selected |
|--------|-------------|----------|
| Increase seed size (recommended) | Bump total deals (e.g. to ~80-100) so each rep has a reasonable spread across won/lost/open | ✓ |
| Keep 40 deals | No seed-data volume change; widgets may look thin for several reps | |
| You decide | Claude decides seed volume during planning | |

**User's choice:** Increase seed size

| Option | Description | Selected |
|--------|-------------|----------|
| New categorical palette (recommended) | Define new CSS chart-color tokens (e.g. --chart-owner-1..5) distinct from the stage palette | ✓ |
| Reuse existing --chart-1..5 tokens | Assign one of the existing unused grayscale oklch tokens per rep | |
| You decide | Claude picks during planning/execution | |

**User's choice:** New categorical palette

**Notes:** None beyond the selections above.

---

## Historical Close-Date Data

| Option | Description | Selected |
|--------|-------------|----------|
| New closedDate field (recommended) | Add a closedDate to Deal, populated only for won/lost outcomes, seeded with a historical spread | |
| Reuse existing won-deal contract dates | Won deals reuse contractSignedDate for the "closed" date in charts; lost deals still need something added | ✓ |
| You decide | Claude decides the data-model approach during planning/research | |

**User's choice:** Reuse existing won-deal contract dates (contractSignedDate)

| Option | Description | Selected |
|--------|-------------|----------|
| New lostDate field (recommended) | Add a lostDate to Deal, mirroring the won-deal pattern | |
| Reuse closeDate for lost deals | Lost deals keep using closeDate instead of a new field; closeDate's seeding needs to be backdated for lost outcomes specifically | ✓ |
| You decide | Claude decides the data-model approach during planning/research | |

**User's choice:** Reuse closeDate for lost deals

| Option | Description | Selected |
|--------|-------------|----------|
| Outcome-aware seeding (recommended) | open deals keep closeDate forward-looking; won deals use contractSignedDate; lost deals get closeDate backdated to a historical spread | ✓ |
| You decide | Claude decides the exact seeding logic during planning/research | |

**User's choice:** Outcome-aware seeding

| Option | Description | Selected |
|--------|-------------|----------|
| Trailing 12 months (recommended) | Spans a full year of closed-deal history for a real trend | ✓ |
| Trailing 90 days (matches existing contract-date range) | Matches current contractSignedDate seeding, but thinner trend | |
| You decide | Claude decides the exact historical range during planning | |

**User's choice:** Trailing 12 months

**Notes:** This combination means `closeDate` carries a dual meaning after Phase 6: "expected close" for open deals, "when it actually closed" for lost deals. Flagged explicitly in CONTEXT.md D-05 with a `costly` reversibility rating.

---

## Claude's Discretion

- Exact seed volume (D-02) — planner picks a number that makes all 5 widgets look populated, verifying each rep has ≥1 won deal.
- Sales target definition (value source, period) — gray area identified during codebase scouting but not discussed in this session; left to planning.
- Gauge widget visual style (radial vs. progress bar) — identified but not discussed; no existing precedent component; left to planning/research.
- Time-bucket granularity for DASH-02/DASH-05 (weekly vs. monthly) — not explicitly discussed; monthly implied by the trailing-12-month range but left to planning.

## Deferred Ideas

None — discussion stayed within phase scope.
