# iDrive CRM Prototype

## Current State

**Shipped:** v1.1 Confidence-Based Forecast Breakdown — 2026-09-16 (1 phase, 1 plan, 3/3 v1.1 requirements complete)

The full pipeline lifecycle works end-to-end on mock data: prospects flow through Prospect → Lead → Opportunity → Deal, deals carry full line-item detail and captured contract terms, lost deals require a reason and land in a distinct group, won deals roll up as the contracts-made list, and a Forecast page turns all of that into pipeline value/win-rate/loss-reason analysis plus a confidence-grouped financial breakdown across the entire pipeline (open, won, and lost). Confidence level is now editable inline from the pipeline table, same click-to-edit pattern as owner/value/close date. Live demo: https://eld-dusky.vercel.app

## Next Milestone Goals

Not yet defined — run `/gsd-new-milestone` to scope the next version. Candidates already flagged in REQUIREMENTS.md's v2 list and PROJECT.md decisions: real API/database persistence (replacing the mock repository), authentication/multi-user pipelines, stalled-deal flagging (ANLY-01), and the eventual merge into the existing iDrive project. Also worth considering: widening test coverage beyond Phase 5's unit-only scope (no component/interaction/e2e tests yet), and the small set of non-blocking review warnings accumulated across phases (see STATE.md Blockers/Concerns).

## What This Is

A React frontend prototype of a CRM for iDrive's sales pipeline, inspired by monday.com's board/table UI but with its own visual identity. It tracks prospects as they move through Prospect → Lead → Opportunity → Deal, keeps a record of deals that fell through (with a reason), lists closed/won deals as contracts made, and provides a forecast page for pipeline analysis. This phase is frontend-only, running on mock/seed data — no backend, API, or authentication yet.

## Core Value

A working, demoable pipeline view — prospects flow through stages, lost deals are tracked with reasons, and won deals roll up as the contract list — solid enough to later wire into iDrive's existing project without a rebuild.

## Requirements

### Validated

- ✓ Grouped table view with pipeline stage groups: Prospect, Lead, Opportunity, Deal (Won), Lost — Phase 1
- ✓ User can add a new prospect/deal via a form — Phase 1
- ✓ User can move a deal between pipeline stages — Phase 1
- ✓ User can edit deal details inline (fields and line items) — Phase 2
- ✓ Each deal supports line items (subitems): product/service, SKU, units, unit price, subtotal, type — Phase 2
- ✓ User can capture deal-terms/contract fields (Prorata, Grace Period, Contract Term, Frequency, Currency) via a 2-step Add Deal wizard, for every new deal at creation — Phase 3
- ✓ User can mark a deal as lost, capture a reason, and it moves to a separate Lost group — Phase 3.1
- ✓ Won deals are listed as the "contracts made so far" view (no separate contract entity) — Phase 3.1
- ✓ User can search, filter (owner/value/stage/close date), and sort the pipeline table — Phase 4
- ✓ Forecast page showing raw/weighted pipeline value, win rate, and a lost-deal breakdown by reason/stage, derived from mock data — Phase 4
- ✓ All data is mock/seed data held in app state — no persistence layer yet — confirmed holding through Phase 4, no backend introduced
- ✓ User can edit a deal's confidence level inline from the pipeline table (not just at creation via the Add Deal wizard) — Phase 5
- ✓ Forecast page shows a table of all deals (open, won, and lost) grouped by confidence level, with per-deal Model/Services/Quantity/ARPU/MRR/ARR/Lifetime Contract Value/Contract Length columns and per-group + grand-total subtotal rows — Phase 5

### Active

Not yet defined — scope the next milestone with `/gsd-new-milestone`.

### Out of Scope

- Backend/API integration — deferred; forms will eventually POST to a database, but this phase stays frontend-only until merged into the existing iDrive project
- Authentication / multi-user — prototype is single-user, no login screen
- Kanban board and calendar views — table view only for v1
- Deal health/risk scoring as a distinct feature — "evaluations" and "forecasts" are treated as the same analysis feature, not two
- Close visual clone of monday.com — building the same concepts (groups, table, subitems) with a distinct design, not pixel-matching the screenshot

## Context

- Reference screenshot: monday.com's "Deals" board (IdriveAI CRM workspace) — grouped table with colored status groups, subitems for inventory line items (SKU, units, price, product/service type), and a Nexus integration status column. Used for concept inspiration only, not a visual target.
- The user has an existing iDrive project this CRM is ultimately meant to integrate into (adding real API/database wiring). That project's code is not yet present in this repository — integration is explicitly future work, not part of this milestone.
- React was chosen as the stack partly to align with the likely stack of that existing project, reducing future rework when integration happens.
- Current codebase: ~4,700 LOC TypeScript/TSX (Vite 8 + React 19.2 + TypeScript 5.9.3 + Zustand + TanStack Table + Tailwind v4 + shadcn/ui). Vitest was added in Phase 5 as the project's first test framework (unit tests only, covering pure derived-value functions — no component/interaction/e2e tests yet).
- A small set of non-blocking review warnings has accumulated across phases (repository patch-type drift not covering `confidenceLevel`, missing double-submit guards, no exhaustiveness guard on confidence grouping, etc.) — see STATE.md Blockers/Concerns for the full list; none block current functionality but are worth sweeping before a real-backend integration phase.

## Constraints

- **Scope**: Frontend only — no API calls, no database, no auth in this phase
- **Data**: Mock/seed data held in-app — no persistence layer; structured so it's easy to swap for a real API later
- **Tech stack**: React — chosen for likely compatibility with the existing iDrive project this will eventually integrate into

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Pipeline order: Prospect → Lead → Opportunity → Deal | Standard sales funnel progression, confirmed by user over the initially-stated order | Shipped Phase 1 — `PipelineStage` type + 5 fixed board groups (Lost derived, not a stage) |
| Mock/seed data only, no persistence | Backend/API is explicitly deferred to post-integration work | Shipped Phase 1 — `DealsRepository` interface + `MockDealsRepository`, swap-ready seam, zero network calls |
| Own visual design, monday.com concepts only | Avoid a close visual clone; reuse pipeline/groups/subitems concepts | Shipped Phase 1 — tinted cards, left accent bars, per-group icons, original 5-hue palette; human-confirmed distinct in UAT |
| React as frontend stack | Improves odds of a clean merge into the existing iDrive project later | Shipped Phase 1 — Vite 8 + React 19.2 + TypeScript 5.9.3, builds and runs cleanly |
| Line items (subitems) per deal | Needed to capture product/service composition, mirroring the monday.com reference | Shipped Phase 2 — `LineItemsTable` (add/edit/remove), value auto-tracks the sum via `sumLineItems`/`hasManualOverride` with a manual-override + reset-to-sum path, positive-value validation on units/unitPrice |
| Lost deals tracked in a separate group with a reason field | User wants to see what fell through and why | Shipped Phase 3.1 — picking "Lost" in `StageSelect` opens a required-reason `Popover` (5-option enum + optional note) gating the atomic `moveToLost` store action; dismissing calls zero store actions |
| Won deals double as the "contracts made" list | No separate contract entity needed — a closed-won deal is the contract | Shipped Phase 3.1 — "won" registered as a genuinely distinct `PipelineGroup` ("Contracts", own icon/accent/empty-state copy); picking "Won" opens `WonContractTermsDialog` (4 required fields + read-only Final Contract Value) gating the atomic `moveToWon` action |
| Won triggered via `StageSelect`'s dropdown opening a dedicated dialog, not an in-place Add/Edit-modal "Next" vs "Save" swap | The originally-sketched mechanism (roadmap Phase 3.1 Success Criterion 3) assumed Won capture happened inside the same modal as deal creation/editing; the shipped design instead intercepts the pipeline table's own stage dropdown, matching the same pattern already used for Lost | Shipped Phase 3.1 — confirmed as an acceptable realization of "gate Won behind a contract-terms form before the transition commits" by the user at UAT (`03.1-UAT.md` test 7); `03.1-UI-SPEC.md` Assumption #1 |
| `moveStage`/`moveToLost`/`moveToWon` don't clear the opposing terminal-state's fields when a deal transitions away from Lost/Won (stale `lostReason` or contract-term fields persist) | Surfaced by code review (`03.1-REVIEW.md` CR-01) as reachable via the shipped dropdown, not a hypothetical bypass | Accepted as a deferred gap by the user at UAT (`03.1-UAT.md` test 8) — flagged for a fix before Phase 4's FCST-02 (loss-reason breakdown) consumes `lostReason`/contract-term data, since a deal un-Lost/un-Won today keeps stale values |
| Deal-terms/contract fields (Prorata, Grace Period, Contract Term, Frequency, Currency) captured on every new deal, at creation | User wants this data captured up front for later contract/quote template generation, regardless of pipeline stage | Shipped Phase 3 — `AddDealDialog` converted to a 2-step wizard (step 1 unchanged; step 2 adds all 5 fields via `addDealStep2Schema`, required with sane numeric bounds); accepted risk that un-touched step-2 defaults are indistinguishable from deliberately-entered values, confirmed acceptable for this phase's scope by the user at UAT (`03-SECURITY.md` AR-03-01) |
| Forecast page included in v1 | User wants evaluation/forecast analysis available now, not deferred to v2 | Shipped Phase 4 — `ForecastPage` with raw/weighted pipeline value + win-rate stat tiles and lost-by-reason/lost-by-stage Recharts bar charts, kept mounted alongside the Pipeline tab via CSS `hidden` toggle (no remount, filter/sort state survives tab switches) |
| Pipeline search/filter/sort shared across all 6 stage tables via a lifted-state `PipelineToolbar` | User needs to find/focus specific deals in a 40+ deal pipeline instead of scrolling six full tables | Shipped Phase 4 — `PipelineToolbar` (pure props-in/callbacks-out, zero store imports) drives `globalFilter`/`columnFilters`/`sorting` through TanStack Table's native APIs, synchronized across all 6 `GroupSection`→`DealTable` instances; group badges/totals recompute from the visible (post-filter) row model, not the raw array |
| CR-01 fix (stale `lostReason`/contract-term fields surviving a Lost/Won→Prospect reversal) | Flagged at Phase 3.1 UAT as a deferred gap that would corrupt Phase 4's loss-reason breakdown if left unfixed | Shipped Phase 4 — centralized `clearPatchFor` helper spread into all 3 stage-transition store actions (`moveStage`/`moveToLost`/`moveToWon`), confirmed exactly 3 call sites and replay-tested in UAT |
| No authentication in prototype | Single-user scope for this phase | Confirmed Phase 1 — no auth code exists anywhere in the codebase |
| TypeScript pinned to 5.9.3, not 7.0.2 | `typescript-eslint@8.68.0`'s peer range (`<6.1.0`) is incompatible with TS 7's native compiler | Shipped Phase 1 |
| Stage moves via a per-row dropdown, not drag-and-drop, in Phase 1 | Ship the simpler mechanism first; `@dnd-kit` packages are installed but reserved for a same-`moveStage`-action Phase 2+ fast-follow | Shipped Phase 1 |
| Deal detail interaction model: chevron-expandable sub-row, not a drawer | User-directed pivot after Phase 2's initial execution — inline table editing already covered all 4 core fields, leaving line items as the drawer's only unique job, so it moved to a chevron-toggle sub-row (closer to the tech stack's originally-recommended `getSubRows`-style pattern); the drawer (`DealDetailDrawer.tsx`, `sheet.tsx`) was removed entirely | Shipped Phase 2 (quick task 260908-f9d) |
| Pipeline board widened to ~95% of viewport width | User wants more horizontal room now that rows carry a chevron + ID column alongside the original 5 fields | Shipped Phase 2 (quick task 260908-f9d) |
| Deal IDs display as 10-digit numeric strings, not UUIDs | User-requested display/format preference; a "Deal ID" column was also added as the last table column | Shipped Phase 2 (quick tasks 260908-i18, 260908-i6f) |
| Standalone Vercel deployment for demo purposes | User wants to showcase the prototype before the eventual merge into the existing iDrive project | Shipped Phase 2 (quick task 260909-dig, `vercel.json`) — live at https://eld-dusky.vercel.app |
| ARPU reintroduced as MRR / service quantity (derived, never stored) | Previously removed entirely (quick task 260910-gpd); milestone v1.1's confidence-grouped forecast table needs it back, but as a computed value consistent with the codebase's never-store-derived-values convention, not a re-added stored field | Shipped Phase 5 — `computeArpu` in `deal-metrics.ts`, zero-quantity guard renders "—" instead of `NaN`/`Infinity` |
| Forecast table's "Model" column reuses `LineItem.sku` | No new field added to `LineItem` for this milestone; `sku` already carries the model-identifier role the reference screenshot's Camera/GPS Model columns implied | Shipped Phase 5 — `joinModelSkus` comma-joins all line-item skus, em-dash fallback when blank |
| Confidence-grouped forecast table includes all deals regardless of outcome (open/won/lost) | User wants full visibility across the pipeline, not just still-open deals — differs from the existing weighted-pipeline-value calculation's open-only scope | Shipped Phase 5 — `groupDealsByConfidence` reads the full unfiltered `deals` selector, no outcome filter |
| Vitest adopted as the project's first test framework | Milestone v1.1's forecast-breakdown/confidence-grouping logic is pure-function business logic well-suited to unit testing; no test framework existed before this phase | Shipped Phase 5 — `vitest.config.ts`, 7 unit tests across `deal-metrics.test.ts`/`forecast-breakdown.test.ts`; no component/interaction/e2e tests yet |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-09-16 after v1.1 milestone*
