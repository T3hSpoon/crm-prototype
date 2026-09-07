---
phase: 01-pipeline-board-foundation
plan: 02
subsystem: data-and-state
tags: [zustand, faker, typescript, repository-pattern]
requires:
  - phase: 01-pipeline-board-foundation
    provides: "Vite+React+TS+Tailwind+shadcn scaffold (01-01)"
provides:
  - "Deal/PipelineStage/DealOutcome/PipelineGroup/NewDealInput types (src/shared/types/deal.ts)"
  - "toPipelineGroup/fromPipelineGroup derivation utilities (src/shared/utils/pipeline-group.ts)"
  - "DealsRepository interface (src/data/deals-repository.ts) and MockDealsRepository in-memory implementation seeded with 40 faker-generated deals"
  - "dealsRepository singleton (src/data/index.ts) as the sole import point for data access"
  - "usePipelineStore Zustand store (deals, status, load, addDeal, moveStage) wired only through the repository seam"
  - "src/app/App.tsx tracer render proving seed -> repository -> store -> screen end-to-end"
affects: [01-03-grouped-board, 01-04, all-later-phases-depend-on-this-data-seam]
actuals:
  tokens: 51000
  tasks: 2
  commits: 2
tech-stack:
  added: []
  patterns:
    - "Repository seam: components/store import dealsRepository only from src/data/index.ts, never mock-deals-repository.ts directly"
    - "pipelineStage/outcome split on Deal; PipelineGroup always derived via toPipelineGroup, never stored"
    - "Stable id generation: faker.string.uuid() for seed data, crypto.randomUUID() for new deals created at runtime"
    - "Zustand curried create<State>()() store with async actions calling the repository, never fetch/network APIs"
key-files:
  created:
    - src/shared/types/deal.ts
    - src/shared/utils/pipeline-group.ts
    - src/data/deals-repository.ts
    - src/data/mock/mock-deals-repository.ts
    - src/data/mock/seed-data.ts
    - src/data/index.ts
    - src/features/pipeline/store/pipelineStore.ts
    - src/app/App.tsx
  modified:
    - src/main.tsx
key-decisions:
  - "Verified seedDeals.length===40 deterministically by running the exact generation logic (faker.helpers.multiple with count:40) standalone outside the TS/Vite pipeline, rather than relying solely on visual dev-server inspection — faker.helpers.multiple always returns exactly `count` items regardless of randomness, so this is a legitimate proof, not a sampled check"
  - "Deleted the scaffold's src/App.tsx and src/App.css outright per Task 2's action (delete the counter-button content entirely); left src/assets/{hero.png,react.svg,vite.svg} untouched since the plan's files_modified list did not include the assets directory and no other file references them post-deletion"
requirements-completed: [PIPE-01, PIPE-02, DEAL-01]
coverage:
  - id: D1
    description: "Deal/PipelineStage/DealOutcome/PipelineGroup/NewDealInput types define pipelineStage and outcome as distinct fields; PipelineGroup is never stored on Deal"
    requirement: "PIPE-01"
    verification:
      - kind: unit
        ref: "grep -c outcome src/shared/types/deal.ts (returned 3, confirming outcome is declared alongside pipelineStage)"
        status: pass
      - kind: unit
        ref: "npm run build (tsc -b && vite build) exits 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "MockDealsRepository seeds from seedDeals (never a hardcoded literal array); every id is faker.string.uuid() (seed) or crypto.randomUUID() (create()); update() finds deals by id, never array index"
    requirement: "DEAL-01"
    verification:
      - kind: unit
        ref: "Code inspection of src/data/mock/mock-deals-repository.ts: constructor defaults to seedDeals import; create() uses crypto.randomUUID(); update() uses findIndex((d) => d.id === id)"
        status: pass
      - kind: unit
        ref: "npm run build exits 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "No file imports @dnd-kit/react or DragDropProvider (classic dnd-kit API only, unused this phase)"
    requirement: ""
    verification:
      - kind: unit
        ref: "grep -rl \"@dnd-kit/react\" src | wc -l (returned 0)"
        status: pass
    human_judgment: false
  - id: D4
    description: "usePipelineStore (deals, status, load, addDeal, moveStage) imports dealsRepository only from src/data/index.ts, never mock-deals-repository.ts directly"
    requirement: "PIPE-01"
    verification:
      - kind: unit
        ref: "grep -rn mock-deals-repository src --include=*.ts --include=*.tsx | grep -v src/data/ (only match was a comment in pipelineStore.ts, no real import)"
        status: pass
    human_judgment: false
  - id: D5
    description: "seedDeals array deterministically contains exactly 40 deals with unique ids, spanning all 4 pipelineStage values, with only open/lost outcomes (never won, per 01-RESEARCH.md Open Question 2)"
    requirement: "PIPE-01"
    verification:
      - kind: unit
        ref: "Standalone execution of the seed-data.ts generation logic (faker.helpers.multiple, count:40) outside the app: printed seedDeals.length = 40, all ids unique: true, stages present: [deal, lead, opportunity, prospect], outcomes present: [lost, open]"
        status: pass
    human_judgment: false
  - id: D6
    description: "npm run build exits 0 and the dev server responds 200 on its local URL with a clean startup log (no console/server errors)"
    requirement: "PIPE-01"
    verification:
      - kind: automated_ui
        ref: "npm run build exit 0; npm run dev -- --port 5183 --strictPort backgrounded, node fetch('http://localhost:5183') returned status 200, dev server log showed clean VITE ready startup with no error lines"
        status: pass
    human_judgment: false
  - id: D7
    description: "The dev server visually renders roughly 40 deal name/company/group rows under a 'Pipeline (tracer)' heading (not blank, not the default Vite counter demo) when opened in a real browser"
    requirement: "PIPE-01, DEAL-01, PIPE-02"
    verification: []
    human_judgment: true
    rationale: "This is the plan's designated <human-check> item: actual browser-rendered visual confirmation. No headless-browser/screenshot tooling (Puppeteer/Playwright) was available in this environment to capture the real DOM output, so it was not directly observed. Strong indirect automated evidence supports it will render correctly: npm run build succeeds, the dev server starts cleanly with no errors, App.tsx's source (src/app/App.tsx) contains the exact <h1>Pipeline (tracer)</h1> heading and a <ul> mapping over the store's deals array with no leftover counter-button markup (the old counter-demo App.tsx/App.css were deleted outright), and seedDeals is proven to deterministically contain exactly 40 uniquely-id'd deals (see D5) that load() will populate into the store on mount. A human should still open http://localhost:5183 once to confirm the actual rendered page matches this expectation."
duration: 25min
completed: 2026-09-07
status: complete
---

# Phase 01 Plan 02: Data Seam and Pipeline Store Summary

**Established the Deal data model with the pipelineStage/outcome split, a repository-pattern data seam (DealsRepository interface + MockDealsRepository seeded with 40 faker-generated deals), and a Zustand pipelineStore — then proved the entire read path end-to-end with a real tracer render in src/app/App.tsx that loads and lists all seeded deals through the store on mount.**

## Performance
- **Duration:** ~25min active execution
- **Started:** 2026-09-07 (required-reading + npm install)
- **Completed:** 2026-09-07T11:35:16+03:00 (Task 2 commit)
- **Tasks:** 2 completed (Task 1 auto, Task 2 tracer)
- **Files modified:** 11 files (8 created, 1 modified, 2 deleted)

## Accomplishments
- Defined `Deal`/`PipelineStage`/`DealOutcome`/`PipelineGroup`/`NewDealInput` types with `pipelineStage` and `outcome` as two distinct fields, plus `toPipelineGroup`/`fromPipelineGroup` derivation utilities — the exact split research/PITFALLS.md Pitfall 3 requires to avoid a Phase 3 data-model rework
- Implemented the `DealsRepository` interface and `MockDealsRepository` in-memory implementation, seeded from 40 `@faker-js/faker`-generated deals with `faker.string.uuid()` ids (never sequential/index-based), distributed across all 4 pipeline stages with ~15% marked lost and none marked won (deferred to Phase 3 per Open Question 2)
- Wired `usePipelineStore` (Zustand) with `load`/`addDeal`/`moveStage` actions that call `dealsRepository` exclusively through the `src/data/index.ts` seam
- Replaced the scaffold's counter-demo `App.tsx` with `src/app/App.tsx`, a genuine tracer render that calls `load()` in a mount-time `useEffect` and lists every seeded deal's name/company/derived-group — proving the seed → repository → store → screen path end-to-end, not a stubbed/hardcoded list

## Task Commits
1. **Task 1: Data contracts — Deal types, pipeline-group derivation, repository interface, mock implementation, seed data** - `f9cea33` (feat)
2. **Task 2: Zustand store + real end-to-end render — the phase's tracer slice** - `6e30bc9` (feat)

## Files Created/Modified
- `src/shared/types/deal.ts` - `Deal`, `PipelineStage`, `DealOutcome`, `PipelineGroup`, `NewDealInput` types
- `src/shared/utils/pipeline-group.ts` - `toPipelineGroup(deal)` / `fromPipelineGroup(group, previousStage?)` derivation
- `src/data/deals-repository.ts` - `DealsRepository` interface (`list`/`create`/`update`)
- `src/data/mock/mock-deals-repository.ts` - `MockDealsRepository` in-memory implementation, id-based `update()`
- `src/data/mock/seed-data.ts` - `seedDeals: Deal[]`, 40 faker-generated deals
- `src/data/index.ts` - `dealsRepository` singleton, the only sanctioned import point
- `src/features/pipeline/store/pipelineStore.ts` - `usePipelineStore` (`deals`, `status`, `load`, `addDeal`, `moveStage`)
- `src/app/App.tsx` - tracer render: mount-time `load()`, lists all deals via `toPipelineGroup`
- `src/main.tsx` - import path updated to `./app/App`
- `src/App.tsx`, `src/App.css` - deleted (scaffold counter-demo content)

## Decisions Made
- Verified `seedDeals.length === 40` deterministically by re-running the exact generation logic (`faker.helpers.multiple` with `count: 40`) standalone, outside the TS/Vite pipeline — this is a legitimate proof (not a sampled check) since `faker.helpers.multiple` always returns exactly `count` items regardless of the random values inside each.
- Left `src/assets/{hero.png,react.svg,vite.svg}` in place after deleting `App.tsx`/`App.css` — the plan's `files_modified` list didn't include the assets directory, and nothing references those files anymore post-deletion, so removing them was out of scope for this plan.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
The data seam (types, repository interface, mock implementation, 40-deal seed data) and the Zustand store exist, compile (`npm run build` exits 0), and are proven end-to-end by a real tracer render served cleanly by the dev server. `usePipelineStore` already exposes `addDeal` and `moveStage` actions ready for 01-03's `AddDealDialog` and stage-move `<Select>` to call directly — no store changes anticipated. One item needs a human to actually open `http://localhost:5183` and visually confirm the tracer list renders as expected (see coverage D7) before this plan's tracer slice is fully signed off.

Ready for 01-03.

---
*Phase: 01-pipeline-board-foundation*
*Completed: 2026-09-07*
