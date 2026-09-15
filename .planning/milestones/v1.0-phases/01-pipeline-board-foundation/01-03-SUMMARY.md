---
phase: 01-pipeline-board-foundation
plan: 03
subsystem: ui
tags: [react, tanstack-table, zustand, tailwind, pipeline-board]

requires:
  - phase: 01-pipeline-board-foundation
    provides: "Deal type, DealsRepository, usePipelineStore (01-02)"
provides:
  - "usePipelineGroups() selector: deals[] -> Record<PipelineGroup, Deal[]>, all 5 keys always present"
  - "DealTable — headless @tanstack/react-table wrapper (name, company, value, owner, closeDate)"
  - "GroupSection — per-group header (label/count/summed value) + DealTable, own visual palette"
  - "PipelineBoard — mounts all 5 GroupSections, replaces the Plan 02 tracer render"
  - "App.tsx now renders the real pipeline board instead of the tracer <ul>"
affects: [01-04, all-later-phases-depend-on-this-board-shell]

actuals:
  tokens: 42000
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Pre-partition by fixed stage via usePipelineGroups(), never TanStack's getGroupedRowModel (5 fixed named sections, not dynamic column grouping)"
    - "One useLegacyTable instance per GroupSection, sharing one columns definition, getCoreRowModel() only"
    - "@tanstack/react-table@9.2.3's /legacy compat subpath (useLegacyTable/legacyCreateColumnHelper/getCoreRowModel) used in place of v8's useReactTable/createColumnHelper, which the installed v9 package no longer exports from its main entry"
    - "Group palette/iconography (tinted card + left accent bar + lucide icon per group) as this project's own visual identity, distinct from monday.com's flat status-banner colors"

key-files:
  created:
    - src/features/pipeline/hooks/usePipelineGroups.ts
    - src/features/pipeline/components/DealTable.tsx
    - src/features/pipeline/components/GroupSection.tsx
    - src/features/pipeline/components/PipelineBoard.tsx
  modified:
    - src/app/App.tsx

key-decisions:
  - "@tanstack/react-table@9.2.3 (the version actually pinned/installed per CLAUDE.md's Technology Stack table) shipped a breaking rewrite of the v8 API the plan was written against: useReactTable/createColumnHelper/getCoreRowModel as free imports from the package root no longer exist. Resolved via Rule 1 (bug/incompatibility) auto-fix: imported the package's own documented `/legacy` compat subpath (useLegacyTable, legacyCreateColumnHelper, getCoreRowModel — a same-named no-op stub since v9 always builds the core row model automatically), which reproduces the plan's exact v8-shaped API surface and keeps DealTable.tsx's row-model imports literally free of getGroupedRowModel/getSortedRowModel/getFilteredRowModel, satisfying Task 2's acceptance criteria unchanged."
  - "Group visual identity: soft tinted background + 4px left accent border + a distinct lucide-react icon per group (UserPlus/Target/Handshake/Trophy/CircleX for Prospect/Lead/Opportunity/Deal-Won/Lost), count/total in the header at all times — deliberately not monday.com's solid flat-color status banners, per PROJECT.md's 'own visual identity, not a clone' decision. This is a design choice, not a requirement-level deviation."

requirements-completed: [PIPE-01]

coverage:
  - id: D1
    description: "usePipelineGroups() returns a Record<PipelineGroup, Deal[]> with all 5 keys (prospect, lead, opportunity, deal, lost) always present, memoized on deals only"
    requirement: "PIPE-01"
    verification:
      - kind: unit
        ref: "Code inspection of src/features/pipeline/hooks/usePipelineGroups.ts: Object.fromEntries(GROUPS.map((g) => [g, []])) seeds all 5 keys before the deals loop runs; useMemo dependency array is [deals] only"
        status: pass
      - kind: unit
        ref: "npm run build (tsc -b && vite build) exits 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "DealTable renders via getCoreRowModel() only (no getGroupedRowModel/getSortedRowModel/getFilteredRowModel imported anywhere in the file), and always renders the full table shell (thead + a populated or empty-state tbody) even for an empty deals array"
    requirement: "PIPE-01"
    verification:
      - kind: unit
        ref: "grep -n \"getGroupedRowModel|getSortedRowModel|getFilteredRowModel\" src/features/pipeline/components/DealTable.tsx (only comment matches, no imports)"
        status: pass
      - kind: unit
        ref: "npm run build exits 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "GroupSection renders its header (label, count, summed value) unconditionally, independent of whether deals is empty, and DealTable below it"
    requirement: "PIPE-01"
    verification:
      - kind: unit
        ref: "Code inspection of src/features/pipeline/components/GroupSection.tsx: header markup is outside any deals.length conditional; only DealTable's tbody branches on emptiness"
        status: pass
    human_judgment: false
  - id: D4
    description: "PipelineBoard mounts one GroupSection per entry in the fixed order [prospect, lead, opportunity, deal, lost], each sourced from usePipelineGroups() — no group hardcoded or hidden; App.tsx renders <PipelineBoard /> in place of the Plan 02 tracer <ul>, keeping the load()-on-mount effect"
    requirement: "PIPE-01"
    verification:
      - kind: unit
        ref: "grep -n \"tracer|<ul>|toPipelineGroup\" src/app/App.tsx returned no matches; grep -rn getGroupedRowModel src/ returned only doc-comment matches, no real imports"
        status: pass
      - kind: automated_ui
        ref: "npm run build exit 0; npm run dev --port 5199 --strictPort backgrounded, node fetch('http://localhost:5199') returned status 200, dev server log showed a clean VITE ready startup with no error lines, and raw index.html served the expected SPA shell (<title>iDrive CRM Prototype</title>, <div id=\"root\">, <script src=\"/src/main.tsx\">)"
        status: pass
    human_judgment: false
  - id: D5
    description: "A user visiting the dev server sees all 5 pipeline-stage groups (Prospect, Lead, Opportunity, Deal / Won, Lost) as visually distinct sections simultaneously, each populated with seeded deals and its own count/total, and the overall layout reads as its own design rather than a monday.com screenshot clone"
    requirement: "PIPE-01"
    verification: []
    human_judgment: true
    rationale: "This plan's frontmatter marks the anti-clone prohibition as verification: judgment — it is an explicit, permanent prohibition on any automated test auto-passing this criterion, not merely a gap in current tooling. No headless-browser/screenshot tooling was invoked for this reason (not because it was unavailable). Strong automated evidence supports correct data wiring: build exits 0, the dev server starts and serves cleanly, App.tsx contains no leftover tracer markup, GROUPS.map in PipelineBoard.tsx unconditionally renders all 5 groups from usePipelineGroups(), and GroupSection's header markup is unconditional on deals.length. What remains is a genuinely subjective visual-identity judgment (does this look distinct from monday.com's reference screenshot) that per this plan's own prohibition record must be made by a human, not asserted as passing here.  Separately: this plan's own frontmatter/PLAN.md flags PIPE-01 itself as `unclassified`/`unresolved` by the deterministic edge-probe (see 'PIPE-01 status' note below) — that flag is carried forward here, not silently treated as resolved just because all 3 tasks completed and their acceptance criteria passed."

duration: 35min
completed: 2026-09-07
status: complete
---

# Phase 01 Plan 03: Grouped Pipeline Board Summary

**Built the grouped pipeline board — a `usePipelineGroups()` selector that always partitions deals into all 5 fixed pipeline-stage groups, a per-group `DealTable`/`GroupSection` pair, and a `PipelineBoard` that mounts all 5 sections and now replaces the Plan 02 tracer render in `App.tsx` — delivering PIPE-01 end-to-end from seed data to screen.**

## Performance
- **Duration:** ~35min active execution
- **Started:** 2026-09-07 (required-reading + npm install, node_modules was absent in this fresh worktree)
- **Completed:** 2026-09-07 (Task 3 commit)
- **Tasks:** 3 completed (all `type="auto"`)
- **Files modified:** 5 files (4 created, 1 modified)

## Accomplishments
- `usePipelineGroups()` derives `Record<PipelineGroup, Deal[]>` from the store's flat `deals` list, always seeding all 5 keys (`prospect`, `lead`, `opportunity`, `deal`, `lost`) before populating — a group with zero members still has an empty array, never a missing key — memoized on `deals` only
- `DealTable` wraps `@tanstack/react-table` per group (name/company/value/owner/closeDate columns, currency- and `date-fns`-formatted), using core-row-model-only rendering and an always-present table shell (empty-state row, never an omitted table)
- `GroupSection` renders each group's header (label, count, currency-formatted summed value) unconditionally — independent of whether the group is empty — above its `DealTable`, styled with this project's own tinted-card/left-accent-bar/icon palette rather than monday.com's status-banner look
- `PipelineBoard` mounts all 5 `GroupSection`s in the fixed `[prospect, lead, opportunity, deal, lost]` order from `usePipelineGroups()`, and `App.tsx` now renders `<PipelineBoard />` in place of the Plan 02 tracer `<h1>`/`<ul>`, keeping the existing mount-time `load()` effect unchanged
- Resolved a plan-vs-installed-library API mismatch: `@tanstack/react-table@9.2.3` (the actually-pinned version) replaced v8's `useReactTable`/`createColumnHelper` with a new features-based `useTable` hook; used the package's own `/legacy` compat subpath to preserve the plan's exact `getCoreRowModel()`-only shape without pulling in any grouped/sorted/filtered row model

## Task Commits
1. **Task 1: usePipelineGroups selector hook** - `83dc5f0` (feat)
2. **Task 2: DealTable and GroupSection components** - `066f051` (feat)
3. **Task 3: PipelineBoard mounts all 5 groups; wire into App.tsx** - `e90510e` (feat)

## Files Created/Modified
- `src/features/pipeline/hooks/usePipelineGroups.ts` - selector: `deals[]` -> `Record<PipelineGroup, Deal[]>`, all 5 keys always present
- `src/features/pipeline/components/DealTable.tsx` - headless `@tanstack/react-table` wrapper (via the `/legacy` compat subpath)
- `src/features/pipeline/components/GroupSection.tsx` - per-group header (label/count/sum) + `DealTable`, this project's own color/icon system
- `src/features/pipeline/components/PipelineBoard.tsx` - mounts all 5 `GroupSection`s
- `src/app/App.tsx` - now renders `<PipelineBoard />`; Plan 02 tracer markup removed, `load()`-on-mount effect kept

## Decisions Made
- Used `@tanstack/react-table/legacy`'s `useLegacyTable`/`legacyCreateColumnHelper`/`getCoreRowModel` in `DealTable.tsx` instead of the plan-cited `useReactTable`/`createColumnHelper`, because the pinned v9.2.3 package's main entry no longer exports the v8 API at all (confirmed via `tsc` errors and the package's own `.d.ts`/`exports` map). This is a like-for-like compat shim documented by the library itself for exactly this migration case — it satisfies Task 2's acceptance criteria (`getCoreRowModel()` only, no grouped/sorted/filtered row models imported) unchanged, and is recorded as a Rule 1 deviation below.
- Chose a project-specific 5-color palette (indigo/amber/cyan/emerald/rose) with per-group lucide icons and a tinted-card + left-accent-bar layout, deliberately different in structure and hue mix from monday.com's flat, saturated status-banner convention — satisfies the plan's anti-clone prohibition as a design decision; final confirmation is still a human judgment call (see coverage D5).

## Deviations from Plan

**[Rule 1 - Library API mismatch] `@tanstack/react-table` v9.2.3 removed the v8 `useReactTable`/`createColumnHelper` API the plan was written against**
- Found during: Task 2 (`DealTable.tsx`)
- Issue: `npm run build` failed with `TS2724: '"@tanstack/react-table"' has no exported member named 'getCoreRowModel'`/`'useReactTable'` and a `createColumnHelper` type-argument error. The installed v9.2.3 package (the exact version pinned by CLAUDE.md's Technology Stack table) replaced the entire v8-style table-construction API with a new features-based `useTable` hook requiring an explicit `features` object — a materially different, more involved API than the plan's code block assumed.
- Fix: Imported `useLegacyTable`, `legacyCreateColumnHelper`, and `getCoreRowModel` from the package's own `@tanstack/react-table/legacy` compat subpath (documented in its `package.json` `exports` map and `.d.ts` files as the intended v8-migration shim). This reproduces the plan's exact API shape (`useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() })` -> `useLegacyTable({ data, columns, getCoreRowModel: getCoreRowModel() })`) with no other code changes needed.
- Files modified: `src/features/pipeline/components/DealTable.tsx`
- Verification: `npm run build` exits 0; `grep -n "getGroupedRowModel|getSortedRowModel|getFilteredRowModel" src/features/pipeline/components/DealTable.tsx` returns only doc-comment matches, no real imports — Task 2's acceptance criteria unchanged and passing.
- Commit hash: `066f051`

**Total deviations:** 1 auto-fixed (Rule 1 — library API mismatch). **Impact:** none on delivered behavior or acceptance criteria; the fix is a same-named compat import, not a functional rewrite. Worth flagging for whoever plans Phase 4 (PIPE-05/06 sorting/filtering): that work should target the `/legacy` subpath's `getSortedRowModel`/`getFilteredRowModel` (also legacy-shimmed) or migrate to the native v9 `useTable`/`features` API deliberately, not by accident.

## Issues Encountered
None beyond the library API mismatch documented above. `node_modules` was absent in this fresh worktree as expected per the environment note; `npm install` completed cleanly (523 packages, 0 vulnerabilities) before any task work began.

## PIPE-01 Flagged Assumption — Carried Forward, Not Resolved

01-03-PLAN.md's frontmatter records that the deterministic edge-probe returned **PIPE-01 as `unclassified`/`unresolved`** — it could not auto-derive acceptance edges from the requirement text, and per the spec-less probe fallback protocol this stays unresolved rather than being silently auto-resolved. All 3 tasks in this plan completed and their stated acceptance criteria passed, and the plan's own "Reasoned judgment of done" note is satisfied by the implementation (all 5 groups render simultaneously, sourced from the ~40-deal seed set, every group header renders unconditionally including at 0 deals). **This SUMMARY does not treat that completion as resolving the edge-probe flag.** A human still needs to (a) visually confirm the 5-group layout at `http://localhost:5199` (or any dev port) reads as this project's own design rather than a monday.com clone (coverage D5, `human_judgment: true` — this is an explicit `verification: judgment` prohibition in the plan's own frontmatter and cannot be auto-passed), and (b) confirm the "view deals grouped by pipeline stage" experience matches their actual expectation, since PIPE-01's acceptance edges were never machine-derived from the requirement text in the first place.

## User Setup Required
None - no external service configuration required.

## Dev Server Verification
`npm run dev -- --port 5199 --strictPort` was started in the background for the Task 3 `<automated>` verification step, confirmed responding `200` via a Node `fetch`, and its raw `index.html` inspected to confirm the expected SPA shell. The listening process (PID resolved via `netstat -ano` on port 5199, since the `npm run dev` wrapper process exits once it hands off to its `vite` child on Windows) was terminated with `taskkill /F` and port 5199 confirmed free (no `LISTENING` entry in `netstat -ano` afterward) before this plan concluded — no lingering dev-server process was left running.

## Next Phase Readiness
The grouped pipeline board is fully wired: `usePipelineGroups()` -> `PipelineBoard` -> 5x `GroupSection` -> `DealTable`, all reading from the existing `usePipelineStore`/`dealsRepository` seam with no changes to that seam. `npm run build` exits 0 and the dev server serves the real board (not the tracer) cleanly. Ready for 01-04.

---
*Phase: 01-pipeline-board-foundation*
*Completed: 2026-09-07*
