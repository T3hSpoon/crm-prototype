# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-09-15
**Phases:** 5 (1, 2, 3, 3.1 inserted, 4) | **Plans:** 11 | **Sessions:** multiple, spanning 2026-08-28 → 2026-09-15

### What Was Built
- Grouped pipeline table (Prospect/Lead/Opportunity/Deal/Lost) on a swap-ready mock `DealsRepository` + Zustand store
- Full deal detail management: inline field editing, line-item (subitem) CRUD with auto-rollup/manual-override value
- 2-step Add Deal wizard capturing deal-terms/contract fields (Prorata, Grace Period, Contract Term, Frequency, Currency) for every new deal
- Explicit Lost (required-reason gate) and Won (contract-terms gate) flows, with Won deals forming the "contracts made" list
- Pipeline-wide search/filter/sort synced across all 6 stage tables via lifted TanStack Table state
- Forecast page: raw/weighted pipeline value, win rate, and lost-deal breakdowns by reason/stage (Recharts)

### What Worked
- The repository-pattern data seam (`DealsRepository` interface + `MockDealsRepository`) held up cleanly across all 5 phases — no phase needed to bypass it, keeping the real-API swap a one-file change as designed
- Gating risky transitions (Lost/Won) behind required forms at the `StageSelect` interception point, rather than reworking the Add/Edit modal, turned out to be a simpler and more consistent mechanism than the originally-sketched design — confirmed acceptable by the user at UAT both times
- Deferring drag-and-drop (dnd-kit installed but unused) in favor of a per-row Select for stage moves avoided unnecessary complexity Phase 1 didn't need, without blocking a future fast-follow
- Centralizing the stale-field-clearing logic (`clearPatchFor`) once CR-01 was flagged, instead of patching each of the 3 call sites separately, closed the whole class of bug in one shipped change

### What Was Inefficient
- Phase 3.1's CR-01 (stale `lostReason`/contract-term fields surviving a reversal) was identified at Phase 3.1 UAT but deliberately deferred rather than fixed in place — it had to be picked back up and fixed at the start of Phase 4 before the forecast breakdown could trust the data. Catching this kind of "this will corrupt a downstream phase's data" issue earlier would have saved a re-visit.
- Several quick tasks (#6/#7/#8) iterated on the same financial-metrics fields (ARPU/MRR/ARR/Lifetime Contract Value) three times in two days before landing on the correct formula — the underlying requirement (key off line-item type, not Value/Frequency) wasn't nailed down before the first attempt shipped.
- No code review was run for Phase 4 before milestone close (flagged in STATE.md, still open) — worth treating "run code review" as a hard gate before a phase is marked done, not an optional follow-up.

### Patterns Established
- Derived/computed data for a whole page (forecast) lives in a pure functions module with no store import (`forecast-metrics.ts` mirroring `deal-metrics.ts`), keeping analysis provably decoupled from any UI-level filter/sort state
- Stage-transition side effects (clearing stale terminal-state fields) are centralized in one helper spread into every action that can cause the transition, rather than duplicated per action
- Deal IDs are stable opaque strings, never array indices — line items and deals are always addressed by ID through the repository layer

### Key Lessons
1. When a code review flags a data-integrity gap that a *later* phase will depend on (like CR-01 feeding Phase 4's forecast), fix it before or at the start of that later phase's plan rather than letting it ride as "deferred" — it becomes blocking work anyway, just later and with less context.
2. When a quick task changes a formula/calculation the user cares about, get the exact formula confirmed before implementing — three iterations on the MRR/ARR calculation in two days suggests the ambiguity should have been resolved with one clarifying question up front.
3. Treat "no code review run for this phase" as a milestone-close blocker, not a note — it was still open at v1.0 close and had to be surfaced explicitly rather than caught automatically.

### Cost Observations
- Model mix: not tracked this milestone
- Sessions: spanned 18 days (2026-08-28 → 2026-09-15), 87 commits, ~4,163 LOC TypeScript/TSX across 5 phases
- Notable: the decimal-phase insertion mechanism (Phase 3.1 inserted between Phase 3 and Phase 4) worked smoothly for an urgent scope addition (Lost/Won tracking) discovered mid-milestone, without renumbering downstream phases

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | multiple | 5 (incl. 1 inserted) | First milestone — established repository-pattern data seam and decimal-phase insertion workflow |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | 0 (not in scope this phase) | n/a | 0 |

### Top Lessons (Verified Across Milestones)

1. Fix data-integrity gaps that feed a downstream phase immediately, not deferred — first observed v1.0 (CR-01).
