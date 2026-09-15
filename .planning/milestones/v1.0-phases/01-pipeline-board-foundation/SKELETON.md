# Walking Skeleton — iDrive CRM Prototype

**Phase:** 1
**Generated:** 2026-08-28

## Capability Proven End-to-End

A user can view the seeded sales pipeline as five grouped stage sections (Prospect, Lead, Opportunity, Deal/Won, Lost), add a new deal through a modal form, and move any deal to a different stage — all running against an in-memory mock data layer with zero backend, zero network calls, and zero persistence.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | React 19.2 + Vite 8 (Rolldown) SPA scaffold, TypeScript **5.9.3** (not 7.0.2) | Locked by CLAUDE.md/PROJECT.md (React for eventual iDrive-project merge compatibility); TS pinned to 5.9.3 because `typescript-eslint@8.68.0`'s peer range caps below TS 7 (RESEARCH.md Pitfall 1) |
| Data layer | `DealsRepository` interface + `MockDealsRepository` (in-memory array, seeded via `@faker-js/faker`) | PROJECT.md mandates mock-data-only this phase; the interface seam is the explicit swap point for a real API when this merges into the existing iDrive project (research/ARCHITECTURE.md) |
| State management | Zustand 5 store (`usePipelineStore`) — components call the store, the store calls the repository, never the reverse | Matches CLAUDE.md; near-zero boilerplate appropriate for a single-store prototype; enforces the repository seam is never bypassed |
| Table | `@tanstack/react-table` v9 — **5 pre-partitioned `useReactTable` instances**, NOT `getGroupedRowModel` | RESEARCH.md Pattern 1 — TanStack's grouping API groups by column *value* dynamically; it is the wrong fit for 5 fixed, always-present, independently-actionable named sections |
| Stage-move mechanism | Per-row shadcn `<Select>` calling `moveStage(dealId, group)` (Claude's Discretion per CONTEXT.md) | `@dnd-kit/core`+`@dnd-kit/sortable` (classic API) are installed per the locked stack but deliberately unused this phase — RESEARCH.md Pattern 3 defers the multi-container drag implementation to a Phase 2+ fast-follow that calls the same `moveStage` action |
| Data model | `Deal.pipelineStage` (funnel position, 4 values) split from `Deal.outcome` (open/won/lost); the 5 UI groups are a **derived** `PipelineGroup`, never stored directly | research/PITFALLS.md Pitfall 3 — a flat `stage` field loses history the moment a deal is marked lost; get the split right now so Phase 3's lost-reason gate and explicit won-transition need no data migration |
| Styling / UI kit | Tailwind CSS v4 (CSS-first `@theme`, no `tailwind.config.js`) + shadcn/ui (Radix-based, copied source, not a dependency) | PROJECT.md's "own visual identity, not a monday.com clone" requirement — shadcn ships unstyled source you restyle, not a themed component library |
| Routing | None this phase — `App.tsx` mounts `<PipelineBoard />` directly | CLAUDE.md/research/STACK.md list no router; Phase 1 has exactly one view. Deferred until Phase 4 adds `/forecast` (RESEARCH.md Open Question 1) |
| Deployment target | Local dev server only (`npm run dev`, default `http://localhost:5173`) | Frontend-only prototype per PROJECT.md; no hosting target defined yet |
| Directory layout | `src/app/`, `src/features/pipeline/{components,hooks,store}`, `src/data/{,mock}`, `src/shared/{types,utils}` | research/ARCHITECTURE.md's recommended feature-folder structure, confirmed by 01-PATTERNS.md as the pattern source of truth (greenfield repo, no codebase analogs) |

## Stack Touched in Phase 1

- [x] Project scaffold (Vite + React + TS, ESLint/Prettier/typescript-eslint, Tailwind v4, shadcn/ui init)
- [ ] Routing — deliberately deferred to Phase 4 (single view this phase)
- [x] "Database" — one real read (seed data through `MockDealsRepository.list()` → `pipelineStore.load()`) AND one real write (`MockDealsRepository.create()`/`.update()` via `addDeal`/`moveStage`)
- [x] UI — interactive elements wired to the store: Add Deal modal (`AddDealDialog`) and per-row stage `<Select>` (`StageSelect`)
- [x] "Deployment" — documented local full-stack run command: `npm run dev`, verified via a dev-server health check

## Out of Scope (Deferred to Later Slices)

- Inline field editing on the board, deal detail drawer/panel (Phase 2)
- Line items / subitems, value roll-up from line items (Phase 2)
- Lost-reason gating (a reason is NOT required to move a deal into the "Lost" group this phase — deliberately deferred to Phase 3, see Flagged Assumptions in 01-04-PLAN.md)
- Explicit won-transition semantics (`outcome: "won"` is never set this phase; the "Deal/Won" UI group is `pipelineStage === "deal"` with `outcome` left `"open"` — Phase 3 owns the real won transition, per RESEARCH.md Open Question 2)
- Drag-and-drop stage-move (`@dnd-kit` classic API installed but unused; Phase 2+ fast-follow)
- Search, filter, sort (Phase 4)
- Forecast page, client-side router (Phase 4)
- Backend/API integration, authentication (post-milestone, explicitly out of scope per PROJECT.md)

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering its architectural decisions:

- Phase 2: Deal detail drawer, inline field editing, line-item composition with auto-rollup value
- Phase 3: Lost-deal flow with required reason (gates the move into "Lost"), explicit Won transition, Won group as the "contracts made" list
- Phase 4: Search/filter/sort across the pipeline table, forecast page (adds the first router route)
