# Milestones

## v1.1 Confidence-Based Forecast Breakdown (Shipped: 2026-09-16)

**Phases completed:** 1 phases, 1 plans, 3 tasks

**Key accomplishments:**

- Inline-editable Confidence column on the pipeline table plus a new all-outcomes, confidence-grouped financial breakdown table with per-group subtotals and a grand total on the Forecast page.

---

## v1.0 MVP (Shipped: 2026-09-15)

**Phases completed:** 5 phases, 11 plans, 29 tasks

**Timeline:** 18 days (2026-08-28 → 2026-09-15), 87 commits, ~4,163 LOC TypeScript/TSX

**Known verification overrides:** 2 newly acknowledged, 0 carried forward from a prior close (see STATE.md Deferred Items) — 2 quick tasks with unknown completion status, both superseded by later quick tasks per STATE.md's Quick Tasks Completed table

**Key accomplishments:**

- Node.js upgraded past Vite 8's minimum, a human-approved package legitimacy review completed, and a building/dev-server-runnable Vite 8 + React 19.2 + TypeScript 5.9.3 project stood up with Tailwind v4 CSS-first styling and shadcn/ui's Radix-based component primitives (button, dialog, select, input, label, field) generated under `src/components/ui/` — every Phase 1 dependency pinned at RESEARCH.md's npm-registry-verified versions, ready for 01-02 to build the data seam on top of it.
- Established the Deal data model with the pipelineStage/outcome split, a repository-pattern data seam (DealsRepository interface + MockDealsRepository seeded with 40 faker-generated deals), and a Zustand pipelineStore — then proved the entire read path end-to-end with a real tracer render in src/app/App.tsx that loads and lists all seeded deals through the store on mount.
- Built the grouped pipeline board — a `usePipelineGroups()` selector that always partitions deals into all 5 fixed pipeline-stage groups, a per-group `DealTable`/`GroupSection` pair, and a `PipelineBoard` that mounts all 5 sections and now replaces the Plan 02 tracer render in `App.tsx` — delivering PIPE-01 end-to-end from seed data to screen.
- Built the Add Deal modal form (D-01 through D-04) and the per-row Stage-move `<Select>` control (RESEARCH.md Pattern 3), then wired both into the 01-03 pipeline board — `PipelineBoard` now has a working "Add Deal" button and every `DealTable` row has a stage-move control, completing every requirement (PIPE-01, PIPE-02, DEAL-01) this phase set out to deliver. This is the final plan in Phase 1 — Phase 1 is now complete, pending the human verification items flagged below.
- A click-to-open deal detail Sheet (shadcn) plus click-to-edit-in-place pipeline-table cells, both auto-committing name/value/owner/closeDate through `pipelineStore.updateDeal()` with per-field pending guards and revert-on-failure error banners — DEAL-02 and DEAL-03 complete.
- A `useFieldArray`-backed line-items mini-table inside the deal detail drawer, wired to a computed-until-touched Value field with an explicit reset-to-sum affordance — DEAL-04 and DEAL-05 complete, closing out Phase 2.
- Converted the single-step Add Deal modal into a 2-step wizard capturing Prorata/Grace Period/Contract Term/Frequency/Currency for every new deal, with all 40 seed deals regenerated to satisfy the extended Deal type.
- Popover-gated Lost-reason capture via a new `moveToLost` atomic store action — picking "Lost" in any row's StageSelect now requires a category before the deal moves, with an optional note and inline failure recovery.
- Contract-terms dialog gating Won transitions via a new `moveToWon` atomic store action and a distinct "Contracts" pipeline group — picking "Won" in any row's stage dropdown now opens a required 4-field contract-terms form before the deal leaves its active stage.
- Shared search/owner/value/close-date/sort toolbar driving all 6 pipeline-stage tables from one lifted TanStack Table state, with group-visibility toggle and filtered-row-accurate badges.
- Forecast page with weighted pipeline value, win rate, and lost-by-reason/stage breakdown via Recharts, built on a store fix that permanently resolves the Phase 3.1 stale lost/won field bug.

---
