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

## Milestone: v1.1 — Confidence-Based Forecast Breakdown

**Shipped:** 2026-09-16
**Phases:** 1 (5) | **Plans:** 1 | **Sessions:** 1, spanning 2026-09-15 → 2026-09-16

### What Was Built
- Inline-editable Confidence column in the pipeline table, matching the existing Owner/Value/Close Date click-to-edit pattern, for deals in any outcome (open/won/lost) — DEAL-07
- A new confidence-grouped financial breakdown table on the Forecast page covering every deal in the pipeline (open, won, and lost), not just open ones — FCST-03
- Per-confidence-group subtotal rows and one grand-total row across Quantity/MRR/ARR/Lifetime Contract Value — FCST-04
- Vitest installed and configured as this project's first test framework

### What Worked
- TDD RED/GREEN commits for the new pure derived-value functions (`deal-metrics.ts`, `forecast-breakdown.ts`) kept each unit of logic (quantity/ARPU computation, confidence grouping, subtotal aggregation) verifiably correct before it was wired into the UI
- Building `ConfidenceCell` as a sibling component to `EditableCell` instead of shoehorning it in as a variant kept the existing 4-column `EditableColumnId` union untouched — no ripple effect on the working click-to-edit pattern
- Reusing one `computeGroupTotals` function for both per-group subtotals and the whole-table grand total avoided a duplicate-aggregation-logic bug class entirely
- A single, tightly-scoped phase (3 requirements, 1 plan, 45 min) for a milestone with no cross-cutting complexity — coarse granularity was the right call here, DEAL-07 had no hard dependency on FCST-03/04 but splitting further would have been overhead for no benefit

### What Was Inefficient
- Vitest had to be installed as a one-time infrastructure cost mid-phase (folded into Task 2's RED commit) because no test framework existed in the project before this milestone — a project this far into development going 5 phases without any automated test coverage meant the first TDD phase paid a setup tax that earlier phases could have amortized
- `05-REVIEW.md` flagged that `DealsRepository`/`MockDealsRepository.update()`'s Pick types were never widened to declare `confidenceLevel`, even though the store now patches it — works today only because the mock repository blindly spreads the patch; this is exactly the kind of type/reality drift that will surface as a real bug the moment a real backend replaces the mock

### Patterns Established
- New click-to-edit cell types are built as siblings to `EditableCell`, not variants, to avoid widening a shared union type for functionality only one column needs
- Ordered grouping keys live in a shared constant array (`CONFIDENCE_LEVELS`), never derived via `Object.keys()` on a grouped record, to guarantee stable render order
- A confidence/outcome-spanning aggregation reads the full unfiltered deals selector rather than any UI-filtered subset, when the requirement calls for whole-pipeline visibility distinct from an existing filtered view

### Key Lessons
1. When a project reaches its first phase that benefits from TDD, expect that phase's estimate to absorb a one-time test-framework setup cost — don't treat the setup as scope creep against that phase.
2. When a mock repository's method signature (e.g., a `Pick<Deal, ...>` patch type) doesn't get widened alongside a new store action that patches an additional field, flag it immediately as review debt rather than letting "the mock works anyway" hide the gap until a real backend swap breaks it.

### Cost Observations
- Model mix: not tracked this milestone
- Sessions: 1 session, ~45 min execution, 9 commits, ~1,014 LOC added (net) across 16 files
- Notable: the smallest and fastest milestone to date — single phase, single plan, no decimal-phase insertions, no mid-flight scope changes

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | multiple | 5 (incl. 1 inserted) | First milestone — established repository-pattern data seam and decimal-phase insertion workflow |
| v1.1 | 1 | 1 | First milestone with TDD RED/GREEN commits; Vitest adopted as the project's first test framework |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | 0 (not in scope this phase) | n/a | 0 |
| v1.1 | 7 (Vitest, unit only) | Pure derived-value functions only — no component/interaction/e2e tests | 0 |

### Top Lessons (Verified Across Milestones)

1. Fix data-integrity gaps that feed a downstream phase immediately, not deferred — first observed v1.0 (CR-01).
2. Widen a mock repository's patch/method types the same commit a store action starts patching a new field — first observed v1.1 (05-REVIEW.md confidenceLevel gap).
