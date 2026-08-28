# Phase 1: Pipeline Board Foundation - Pattern Map

**Mapped:** 2026-08-28
**Files analyzed:** 15 (see File Classification)
**Analogs found:** 0 / 15 — no existing application code in this repo

## No Existing Codebase Analogs

This is a confirmed greenfield repository. `Glob("**/*.{ts,tsx,js,jsx}")` and directory listing at the repo root show only `.claude/`, `.gitignore`, and `.planning/` — no `package.json`, no `src/`, no prior commits containing application code (`git log` shows a single `docs: initialize project` commit). There is nothing to read for imports, auth patterns, error handling, or component conventions because no code has been written yet.

**Do not force false matches.** Every file this phase creates is a first-of-its-kind file in this repo. The pattern source of truth for this phase is:

- **`.planning/research/ARCHITECTURE.md`** — repository-pattern data seam (`DealsRepository` interface + `MockDealsRepository`), recommended `src/` folder structure (`app/`, `features/pipeline/`, `data/`, `shared/types/`), Zustand store pattern (store actions call the repository; components call the store, never the repository directly), forecast-as-derived-selector convention that also applies to `usePipelineGroups`.
- **`.planning/phases/01-pipeline-board-foundation/01-RESEARCH.md`** — Phase-1-specific implementation patterns with concrete, citable code:
  - **Pattern 1** (Architecture Patterns section): 5 pre-partitioned `useReactTable` instances instead of `getGroupedRowModel`, with the `usePipelineGroups` selector shown in full.
  - **Pattern 2**: `pipelineStage`/`outcome` field split on `Deal`, plus the `toPipelineGroup`/`fromPipelineGroup` derivation functions shown in full (`shared/types/deal.ts`, `shared/utils/pipeline-group.ts`).
  - **Pattern 3**: dropdown (`<Select>`) stage-move for Phase 1, calling `moveStage(dealId, group)`; `@dnd-kit` classic API sketch reserved as a Phase 2+ fast-follow using the same store action.
  - **Code Examples section**: full Zustand store (`pipelineStore.ts` with `load`/`addDeal`/`moveStage`), full react-hook-form + zod `AddDealDialog` schema and Controller wiring, full `@faker-js/faker` seed-data generator, full Vite/Tailwind/shadcn scaffold sequence and config files.

These two documents together are more complete and more current for this phase than any codebase analog could be — use them directly as the copy-from source for every file below.

## File Classification

| New File | Role | Data Flow | Pattern Source | Notes |
|----------|------|-----------|-----------------|-------|
| `src/shared/types/deal.ts` | model | CRUD | RESEARCH.md Pattern 2 (full code) | `Deal`, `PipelineStage`, `DealOutcome`, `PipelineGroup` types |
| `src/shared/utils/pipeline-group.ts` | utility | transform | RESEARCH.md Pattern 2 (full code) | `toPipelineGroup` / `fromPipelineGroup` |
| `src/data/deals-repository.ts` | service (interface) | CRUD | ARCHITECTURE.md Component Responsibilities + RESEARCH.md store example's call sites | `DealsRepository` interface: `list()`, `create()`, `update()`, `moveStage()` |
| `src/data/mock/mock-deals-repository.ts` | service (impl) | CRUD | ARCHITECTURE.md Recommended Project Structure | In-memory array implementing `DealsRepository`, seeded from `seed-data.ts` |
| `src/data/mock/seed-data.ts` | config/fixture | batch | RESEARCH.md Code Examples, `@faker-js/faker` seed generator (full code) | 40-deal seed set via `faker.helpers.multiple` |
| `src/features/pipeline/store/pipelineStore.ts` | store | CRUD | RESEARCH.md Code Examples, Zustand store (full code) | `deals`, `load`, `addDeal`, `moveStage` |
| `src/features/pipeline/hooks/usePipelineGroups.ts` | hook | transform | RESEARCH.md Pattern 1 (full code) | Selector: `deals[]` → `Record<PipelineGroup, Deal[]>` |
| `src/features/pipeline/components/PipelineBoard.tsx` | component | request-response | RESEARCH.md System Architecture Diagram + ARCHITECTURE.md Component Responsibilities | Container: mounts `load()` on mount, renders 5x `GroupSection` + Add-Deal trigger |
| `src/features/pipeline/components/GroupSection.tsx` | component | request-response | ARCHITECTURE.md Component Responsibilities row 1 | One per stage; header (label/count/Σvalue) + `DealTable` |
| `src/features/pipeline/components/DealTable.tsx` | component | request-response | RESEARCH.md Pattern 1 (full code) | Wraps `useReactTable({data: groupDeals, columns})`, `getCoreRowModel()` only |
| `src/features/pipeline/components/StageSelect.tsx` | component | event-driven | RESEARCH.md Pattern 3 (full code) | Per-row `<Select>` calling `moveStage(dealId, group)` on change |
| `src/features/pipeline/components/AddDealDialog.tsx` | component | request-response | RESEARCH.md Code Examples, RHF+zod+shadcn Dialog (full code) | shadcn `Dialog` + `useForm`/`Controller` + `zodResolver(addDealSchema)` |
| `src/app/App.tsx` | component (shell) | request-response | RESEARCH.md System Architecture Diagram | Mounts `<PipelineBoard />` directly, no router this phase |
| `vite.config.ts` | config | — | RESEARCH.md Code Examples, scaffold sequence (full code) | `@tailwindcss/vite` + `@vitejs/plugin-react` + `@/*` alias |
| `src/index.css` | config | — | RESEARCH.md Code Examples (full code) | `@import "tailwindcss"`, Tailwind v4 CSS-first, no `tailwind.config.js` |

## Pattern Assignments

No per-file "Analog: `<path>`" sections are provided because no analog files exist. For each file above, follow the "Pattern Source" column directly — copy the corresponding code block verbatim from RESEARCH.md (all are complete, runnable snippets, not fragments) and adapt only naming/imports to the actual scaffolded paths. Do not re-derive these patterns independently; RESEARCH.md's snippets already reconcile the TanStack grouping-API pitfall, the dnd-kit version-pairing pitfall, and the current (post-2024-tutorial) shadcn/ui `Controller`+`Field` form composition — see RESEARCH.md's "Common Pitfalls" and "State of the Art" sections before writing `AddDealDialog.tsx` or any `@dnd-kit` code from memory/older tutorials.

## Shared Patterns

### Repository seam (all data-layer and store files)
**Source:** `.planning/research/ARCHITECTURE.md` lines 28-34, 77-80 and `.planning/phases/01-pipeline-board-foundation/01-RESEARCH.md` Code Examples "Zustand 5 store with a repository-calling async action"
**Apply to:** `pipelineStore.ts`, `mock-deals-repository.ts`, `deals-repository.ts`
Rule: components call the store; the store calls the repository; the repository is the only place that knows data is in-memory (future swap point for a real API). Never let a component import `mock-deals-repository.ts` directly.

### `pipelineStage` / `outcome` split (all files touching `Deal`)
**Source:** RESEARCH.md Pattern 2, full code block
**Apply to:** `deal.ts`, `pipeline-group.ts`, `pipelineStore.ts` (`moveStage`), `AddDealDialog.tsx` (stage selector), `mock-deals-repository.ts` seed shape
Rule: never write a single flat `stage` field. `PipelineGroup` (the 5 UI sections) is always derived via `toPipelineGroup`, never stored directly.

### Stable IDs
**Source:** RESEARCH.md "Don't Hand-Roll" table, row 2
**Apply to:** `mock-deals-repository.ts`, `seed-data.ts`, `pipelineStore.ts`
Rule: use `crypto.randomUUID()` / `faker.string.uuid()` for every `Deal.id`; never array index or a sequential counter.

### Form validation
**Source:** RESEARCH.md Code Examples, `addDealSchema` (zod) + RHF `Controller` pattern
**Apply to:** `AddDealDialog.tsx` only (single form this phase)
Rule: one zod schema is both the RHF resolver and the `NewDealInput` type; five required fields per D-01 (name, company, value, owner, closeDate) plus the `group` stage selector per D-02.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| All 15 files listed in File Classification | — | — | Greenfield repo — zero prior application code exists to serve as an analog for any role/data-flow combination |

## Metadata

**Analog search scope:** Entire repo root (`Glob("**/*.{ts,tsx,js,jsx,json}")`, directory listing, `git log`) — confirmed no `src/`, no `package.json`, no prior application commits.
**Files scanned:** 0 application files (repo contains only `.claude/`, `.gitignore`, `.planning/`)
**Pattern extraction date:** 2026-08-28
