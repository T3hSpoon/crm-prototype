# Project Research Summary

**Project:** ELD CRM sales-pipeline prototype
**Domain:** React frontend prototype -- grouped-table/board CRM pipeline with line items, lost/won tracking, and a forecast/analytics page; mock data only, no backend
**Researched:** 2026-08-28
**Confidence:** MEDIUM

## Executive Summary

This is a frontend-only React prototype of a CRM sales pipeline: a monday.com-style grouped table (Prospect to Lead to Opportunity to Deal/Won, plus Lost) where each deal can carry expandable line items, and a companion forecast page that turns that pipeline data into weighted revenue and win-rate metrics. Experts build this class of tool with a headless table library for grouping/expansion (TanStack Table), a small, purpose-built drag-and-drop or dropdown mechanism for stage moves (dnd-kit), lightweight client state (Zustand) sitting behind a strict repository/data-access seam, and derived (not duplicated) analytics computed from the same deal records the table renders. Own-brand styling (Tailwind + shadcn/ui, unstyled-by-default) satisfies the explicit "not a monday.com clone" requirement without fighting a heavy component library.

The recommended approach is: nail the data model first (stable IDs, pipelineStage separate from terminal outcome, line items one level deep, deal value derivable from line items) behind a DealsRepository interface with a single in-memory mock implementation; build the grouped table and stage-transition/lost-reason flow on top of that; then build the forecast page as pure selectors over the same store, never a second dataset. This ordering directly serves the project's stated end-goal: the mock-to-real-API swap must later be a one-file change, not a rewrite.

The key risks are almost all modeling/discipline risks rather than technology risks: (1) shaping mock data for rendering convenience instead of a future API resource shape, (2) conflating funnel stage with terminal won/lost state, (3) presenting vanity/unweighted forecast numbers as if they were calibrated projections, and (4) baking in standalone-app assumptions (global CSS, index-based updates, ad hoc data access) that make the eventual merge into the existing iDrive project expensive. All four are cheap to prevent up front and expensive to retrofit -- they should be enforced as constraints from the very first phase, not treated as later cleanup.

## Key Findings

### Recommended Stack

React 19.2 + Vite 8 + TypeScript form the runtime baseline (SPA, no SSR/backend needed for this phase). TanStack Table (headless) drives the grouped/expandable pipeline table; dnd-kit handles stage-to-stage drag; Zustand holds client state; Recharts renders the forecast page's charts; Tailwind CSS v4 + shadcn/ui (component-copy, not a dependency) delivers a distinct visual identity. react-hook-form + zod handle forms/validation for deal and line-item entry, and @faker-js/faker seeds realistic mock data. All versions were checked against npm registry metadata as of 2026-08-28 and are mutually compatible with React 19.

**Core technologies:**
- React 19.2 + Vite 8 (TS): SPA runtime/build -- no backend/routing complexity needed for a mock-data prototype
- @tanstack/react-table 9: headless grouped/expandable table -- matches stage-groups + line-item sub-rows exactly
- @dnd-kit/core + sortable 6: stage-to-stage drag-and-drop -- modern, accessible, maintained successor to the now-archived react-beautiful-dnd
- Zustand 5: minimal client state for deals/UI -- right-sized for a single prototype, avoids Redux ceremony
- Tailwind CSS 4 + shadcn/ui: own visual identity without a heavy pre-styled component library
- Recharts 3: forecast page charts -- declarative, React-19-compatible, sufficient chart variety without D3 effort

### Expected Features

**Must have (table stakes):**
- Grouped pipeline table by stage (Prospect/Lead/Opportunity/Deal-Won/Lost) with per-group totals
- Add deal via form; inline edit of key deal fields and line items
- Move deal between stages; mark deal lost with a required, categorized reason
- Per-deal line items (product/service, SKU, qty, unit price, subtotal) with deal value rollup
- Won deals reused as the "contracts made" list (no separate entity)
- Forecast page: pipeline value, weighted/projected revenue, win rate
- Basic search/filter across deals

**Should have (competitive/differentiators):**
- Weighted pipeline value (value times stage probability) rather than a flat sum -- the single most-requested "grown-up" forecasting behavior
- Lost-reason breakdown analytics feeding back from the required reason field
- Line-item-driven, auto-rollup deal value (with override) instead of manually typed totals
- Single unified forecast/analytics page (explicit anti-scope-creep decision -- no separate "health score" module)

**Defer (v2+ / explicitly out of scope):**
- Kanban board view, calendar/activity scheduling, authentication/multi-user, real backend persistence, configurable/custom pipeline stages, AI-generated insights -- all explicitly deferred per PROJECT.md and confirmed as anti-features for this milestone

### Architecture Approach

The system is layered as: UI/pages (Pipeline Board, Deal Detail/Line Items, Forecast Dashboard) then feature hooks/selectors then a Zustand client-state store then a DealsRepository data-access interface then a mock implementation backed by seed fixtures. The repository interface (list/get/create/update/markLost/moveStage) is the single seam meant to be swapped for a real API later without touching component code; store actions call the repository and components only ever call the store. Forecast metrics are pure derivations over the same deals array the table renders, never a second stateful copy, which prevents dashboard/table drift. Project structure is feature-folder based (features/pipeline/, features/forecast/) with a top-level data/ module as the cross-cutting swap point and shared/types defining the Deal/LineItem/PipelineStage contract every layer agrees on.

**Major components:**
1. Pipeline Board -- grouped table, stage moves, add-deal entry point (reads via hooks, never touches the repository directly)
2. Deal Detail / Line Items + Lost-Deal Flow -- inline edit, line-item sub-table, required-reason lost transition as an explicit action
3. Forecast Dashboard -- pure selector functions over the same deals data (pipeline value, weighted value, win rate)
4. Data Access Layer (DealsRepository) -- the seam; one mock implementation today, swapped for an API implementation at integration time
5. Client State Store (Zustand) -- single source of truth for deals + UI-only state, mutated only through named actions

### Critical Pitfalls

1. **Mock data shaped for UI convenience, not a future API resource** -- give every entity a stable id, model stage as an identifier not a label, route all reads/writes through named data-access functions from day one.
2. **Stage-transition / lost-deal logic treated as "just a field edit"** -- split pipelineStage (funnel position) from outcome (open/won/lost); make "mark lost" an explicit action requiring a categorized reason; retain the pre-loss stage.
3. **Forecast computed as a vanity aggregate** -- always show raw pipeline value, weighted/projected value, and win rate as three distinct, clearly labeled numbers; win rate denominator excludes still-open deals.
4. **Editable-grid re-render storms / stale-index edit bugs** -- address every deal/line item by stable id (never array index) in update functions; verify correctness under grouping/filtering.
5. **Standalone-prototype assumptions blocking the future merge into iDrive** -- scope CSS, avoid a global-routing-owning app shell, keep the data-access layer as the one obvious swap point.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Data Model & Mock Data Foundation
**Rationale:** Every other feature (table, stage moves, lost tracking, forecast) depends on getting the entity shape right; this is the highest-leverage, cheapest-to-fix-early phase per PITFALLS Pitfall 1 and Pitfall 3.
**Delivers:** Deal/LineItem/PipelineStage types with stable IDs, pipelineStage separate from outcome, a DealsRepository interface + MockDealsRepository + faker-generated seed data.
**Addresses:** Deal data model, mock/seed data (FEATURES.md dependency graph root)
**Avoids:** Pitfall 1 (mock shaped for UI, not API), Pitfall 3 (flat stage field conflating funnel + terminal state)

### Phase 2: Pipeline Board (Grouped Table + Stage Moves + Add Deal)
**Rationale:** The core pipeline interaction and primary UI surface; builds directly on Phase 1's repository and store pattern.
**Delivers:** Grouped table by stage with per-group totals, add-deal form, move-between-stages interaction, Zustand store wired to the repository.
**Uses:** @tanstack/react-table, Zustand, react-hook-form + zod, Tailwind + shadcn/ui
**Implements:** Pipeline Board + Client State Store components from ARCHITECTURE.md

### Phase 3: Line Items & Deal Detail
**Rationale:** Line items enhance the pipeline table's rollup totals and are a stated hard dependency for the forecast phase; best done once the base table/store exist but before deeper stage-transition and forecast work depend on correct rollups.
**Delivers:** Expandable deal rows with a one-level line-items sub-table, inline edit of deal fields and line items, deal value auto-rollup with override.
**Addresses:** Per-deal line items, inline editing (FEATURES.md P1 items)
**Avoids:** Pitfall 2 (uncontrolled nesting -- cap at one level), Pitfall 5 (id-based, not index-based, edit functions)

### Phase 4: Lost-Deal & Won-Deal Flow
**Rationale:** Depends on the stage/outcome split from Phase 1; must be correct before the forecast phase since win rate and loss-reason analytics are meaningless without reliable lost/won data.
**Delivers:** Explicit "mark as lost" action requiring a categorized reason before the transition completes; Won group doubling as the "contracts made" list.
**Addresses:** Lost-deal tracking, won deals as contracts list (FEATURES.md P1)
**Avoids:** Pitfall 3 (reason-optional-in-practice lost transitions)

### Phase 5: Forecast / Analytics Page
**Rationale:** Explicitly depends on Phases 1, 3, and 4 (deal value, line-item rollups, and resolved lost/won data must already be correct) -- should not start until those are stable.
**Delivers:** Forecast page showing raw pipeline value, weighted/projected revenue (documented per-stage probabilities), and win rate (resolved-deals-only denominator), plus loss-reason breakdown.
**Addresses:** Forecast page, win rate, loss-reason breakdown (FEATURES.md differentiators)
**Avoids:** Pitfall 4 (vanity aggregates presented as calibrated forecasts)

### Phase 6: Search/Filter, Polish & Integration-Readiness Review
**Rationale:** Additive, low-dependency features plus a final cross-cutting check against the "will this merge cleanly into iDrive later" constraint, best done once the core product is functionally complete.
**Delivers:** Search/filter/sort across the pipeline table; a scoped-CSS and single-seam audit before considering the prototype done.
**Avoids:** Pitfall 6 (standalone-app assumptions blocking future merge)

### Phase Ordering Rationale

- Data model must come first: FEATURES.md's dependency graph shows every other feature rooted in the Deal data model, and PITFALLS.md flags this as the highest-leverage phase to get right.
- Line items and lost/won handling are sequenced before forecast because forecast math (weighted value, win rate, loss-reason breakdown) explicitly depends on both being modeled correctly (FEATURES.md "Dependency Notes"; PITFALLS.md Pitfall 4).
- The integration-readiness concern (Pitfall 6) is deliberately placed last as a review rather than owned by one earlier phase, matching PITFALLS.md's own guidance that it's a cross-cutting constraint checked at the end, not built once.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Line Items & Deal Detail):** Rollup/derivation logic and expand/collapse state interaction with grouping/filtering has some nuance (PITFALLS Pitfall 2) worth a closer look during plan-phase.
- **Phase 5 (Forecast/Analytics):** Stage-probability calibration and the raw-vs-weighted-vs-win-rate presentation pattern benefit from a dedicated pass to avoid the vanity-metric trap (PITFALLS Pitfall 4).

Phases with standard patterns (skip research-phase):
- **Phase 1 (Data Model & Mock Foundation):** Repository/adapter pattern is well-documented and directly specified in ARCHITECTURE.md with code examples.
- **Phase 2 (Pipeline Board):** TanStack Table + dnd-kit + Zustand is a well-trodden, directly researched combination with clear library-level guidance.
- **Phase 4 (Lost/Won Flow):** Pattern (explicit action + required reason + outcome field) is fully specified in PITFALLS.md and ARCHITECTURE.md.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Versions verified directly against npm registry metadata; qualitative recommendations cross-checked across multiple current sources, but no Context7/Exa access this session |
| Features | MEDIUM | Cross-checked against monday.com/Pipedrive official support docs and multiple independent CRM-analytics sources; no primary UX testing |
| Architecture | MEDIUM | General React architecture patterns (repository/adapter, feature folders, derived-state selectors) are broad consensus; no domain-specific CRM-board case study found |
| Pitfalls | MEDIUM-HIGH | Synthesized from CRM domain post-mortems, React data-grid engineering pitfalls, and prototype-to-production integration patterns; no single source covers this exact combination, so specifics are triangulated |

**Overall confidence:** MEDIUM

### Gaps to Address

- Exact styling/state-management conventions of the existing iDrive project are unknown (out of scope for this milestone per PROJECT.md) -- Phase 6's integration-readiness review should be revisited once those conventions are known, and Phase 1's stack choices (Vite vs. the host's actual bundler) may need to be swapped at that time.
- typescript-eslint compatibility with TypeScript 7.0's native compiler was unconfirmed at research time -- validate before pinning typescript@7, or fall back to typescript@^5.9 if tooling hasn't caught up.
- Exact stage-probability percentages for the forecast page are placeholders (Prospect 10%/Lead 25%/Opportunity 50%/Deal 80-90%) -- these are illustrative defaults from research, not calibrated figures, and should be treated as an explicit, documented, easily-adjustable config rather than a real prediction.

## Sources

### Primary (HIGH confidence)
- .planning/PROJECT.md -- project's own stated requirements, scope, and constraints

### Secondary (MEDIUM confidence)
- npm registry direct package metadata (2026-08-28) -- version and peer-dependency verification for the full stack
- monday.com official product/support pages, Pipedrive official support docs -- pipeline groups, subitems, lost-reason UX patterns
- bulletproof-react project-structure reference, Robin Wieruch React folder structure guide -- feature-folder architecture conventions
- Repository/adapter pattern references (GeeksforGeeks, Medium engineering posts) -- data-access seam pattern
- CRM integration mistake/post-mortem articles (mindcloud.co, devtrios.com, gridlex.com) -- pitfalls around mock-to-real integration and pipeline management
- Weighted-pipeline and win-rate calculation sources (coefficient.io, forecastio.ai, drivetrain.ai) -- forecast metric definitions

### Tertiary (LOW confidence)
- Various third-party blog/tutorial corroboration on monday.com subitem structure, dnd library comparisons, and general React state-management comparisons -- used only to corroborate points already supported by higher-confidence sources

---
*Research completed: 2026-08-28*
*Ready for roadmap: yes*
