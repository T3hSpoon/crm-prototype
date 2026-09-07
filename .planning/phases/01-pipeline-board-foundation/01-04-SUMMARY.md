---
phase: 01-pipeline-board-foundation
plan: 04
subsystem: ui
tags: [react-hook-form, zod, tanstack-table, shadcn, dialog, select, pipeline-board]

requires:
  - phase: 01-pipeline-board-foundation
    provides: "PipelineBoard/GroupSection/DealTable, usePipelineStore (01-03)"
provides:
  - "addDealSchema (zod) + AddDealFormValues/AddDealFormInput — single source of validation for the Add Deal form"
  - "AddDealDialog — shadcn Dialog + react-hook-form modal implementing D-01 through D-04, wired to usePipelineStore().addDeal()"
  - "StageSelect — per-row shadcn Select calling usePipelineStore.getState().moveStage(dealId, group)"
  - "PipelineBoard now renders an 'Add Deal' button + AddDealDialog"
  - "DealTable's columns array now ends with a StageSelect display column per row"
affects: [phase-1-complete, all-later-phases-build-on-this-write-path]

actuals:
  tokens: 42000
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "react-hook-form's 3-generic useForm<TFieldValues, TContext, TTransformedValues> form used to reconcile z.coerce.number()'s input/output type split with zodResolver — not anticipated by RESEARCH.md's cited 1-generic useForm<AddDealFormValues> snippet"
    - "shadcn's actually-generated Field/FieldLabel/FieldError composition (src/components/ui/field.tsx) used via react-hook-form's Controller — no form.tsx exists in this project (01-01 already substituted field for the now-empty form registry item)"
    - "legacyCreateColumnHelper().display() used for the non-data trailing StageSelect column in DealTable.tsx, alongside the existing .accessor() data columns — same /legacy compat subpath 01-03 established"

key-files:
  created:
    - src/features/pipeline/components/add-deal-schema.ts
    - src/features/pipeline/components/AddDealDialog.tsx
    - src/features/pipeline/components/StageSelect.tsx
  modified:
    - src/features/pipeline/components/PipelineBoard.tsx
    - src/features/pipeline/components/DealTable.tsx

key-decisions:
  - "z.coerce.number() on the `value` field makes addDealSchema's input type (value: unknown) diverge from its output type (value: number) inferred by z.infer. useForm<AddDealFormValues> alone (the plan's literal snippet) fails to type-check against zodResolver(addDealSchema). Resolved by adding a second exported type, AddDealFormInput = z.input<typeof addDealSchema>, and using react-hook-form 7.86's 3-generic form: useForm<AddDealFormInput, unknown, AddDealFormValues> — TFieldValues (raw form state) vs TTransformedValues (the resolver's coerced output, what onSubmit receives). Not a plan deviation in intent (addDealSchema and AddDealFormValues are exactly as specified); purely an additional type needed to make the specified types compile together."
  - "The Value input's controlled `value` prop is cast to `(field.value as string | number | undefined) ?? \"\"` because AddDealFormInput's `value` field is typed `unknown` pre-coercion, which the native <input value> prop does not accept directly."
  - "DealTable's trailing column uses columnHelper.display() (a non-data column keyed by row.original.id + toPipelineGroup(row.original)) rather than .accessor(), since StageSelect needs the whole Deal, not one field's value — the ColumnHelper returned by legacyCreateColumnHelper() supports .display() identically to the v8 API it shims."
  - "PipelineBoard owns the Add Deal button and its open/close useState, per D-03 ('triggered by an Add Deal button' owned by the parent, not the dialog owning its own trigger) — AddDealDialog stays a fully controlled { open, onOpenChange } component with no internal DialogTrigger."

requirements-completed: [PIPE-02, DEAL-01]

coverage:
  - id: D1
    description: "addDealSchema requires all 5 intake fields (name, company, value, owner, closeDate) plus group; value rejects 0 and negative numbers via .positive()"
    requirement: "DEAL-01"
    verification:
      - kind: unit
        ref: "Code inspection of src/features/pipeline/components/add-deal-schema.ts: name/company/owner/closeDate use z.string().min(1, ...), value uses z.coerce.number().positive(...), group is a 5-value z.enum — no field is optional"
        status: pass
      - kind: unit
        ref: "npm run build (tsc -b && vite build) exits 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "Submitting AddDealDialog with a required field empty (or a non-positive value) blocks the addDeal call and keeps the dialog open, showing inline FieldError text"
    requirement: "DEAL-01"
    verification:
      - kind: unit
        ref: "Code inspection: form.handleSubmit(onSubmit) is react-hook-form's own validated-submit wrapper with resolver: zodResolver(addDealSchema) — onSubmit (which calls addDeal and onOpenChange(false)) only ever runs when zod validation passes; every Controller renders <FieldError errors={[fieldState.error]} /> when fieldState.invalid, independent of submit"
        status: pass
    human_judgment: false
  - id: D3
    description: "Submitting AddDealDialog with all fields valid calls usePipelineStore().addDeal(values) exactly once and closes the dialog (D-04, no batch-add/keep-open mode)"
    requirement: "DEAL-01"
    verification:
      - kind: unit
        ref: "Code inspection of AddDealDialog.tsx's onSubmit: awaits addDeal(values) once, then form.reset(DEFAULT_VALUES) and onOpenChange(false) — no loop, no keep-open branch"
        status: pass
    human_judgment: false
  - id: D4
    description: "StageSelect calls moveStage(dealId, group) exactly once per selection and contains no DndContext/useSortable/useDroppable/@dnd-kit import"
    requirement: "PIPE-02"
    verification:
      - kind: unit
        ref: "grep -c \"moveStage\" src/features/pipeline/components/StageSelect.tsx returned 2 (the handler's single call site + its own doc comment); grep for DndContext|useSortable|useDroppable|@dnd-kit returned 0 matches"
        status: pass
      - kind: unit
        ref: "npm run build exits 0"
        status: pass
    human_judgment: false
  - id: D5
    description: "The wired board (PipelineBoard + DealTable) builds cleanly, serves cleanly from the dev server, and issues no axios/XMLHttpRequest calls anywhere in src/features/pipeline"
    requirement: "PIPE-02, DEAL-01"
    verification:
      - kind: unit
        ref: "npm run build exits 0 after Task 3's edits (2540 modules transformed)"
        status: pass
      - kind: unit
        ref: "grep -rlE \"axios|XMLHttpRequest\" src/features/pipeline returned no files (0 matches)"
        status: pass
      - kind: automated_ui
        ref: "npm run dev -- --port 5199 --strictPort backgrounded; node fetch('http://localhost:5199') returned 200 and served the expected SPA shell (<title>iDrive CRM Prototype</title>, <div id=\"root\">, <script src=\"/src/main.tsx\">); AddDealDialog.tsx, StageSelect.tsx, DealTable.tsx, and PipelineBoard.tsx each returned 200 when fetched directly from the dev server (no transform/500 errors); dev server process then terminated and port 5199 confirmed free via PowerShell Get-NetTCPConnection"
        status: pass
    human_judgment: false
  - id: D6
    description: "Adding a deal via the modal reaches its selected GroupSection, and moving a deal via StageSelect relocates it between GroupSections — both without a page reload, purely through the existing deals[] -> usePipelineGroups() -> GroupSection re-render data flow"
    requirement: "PIPE-02, DEAL-01"
    verification:
      - kind: unit
        ref: "Code-path inspection: addDeal(values) and moveStage(dealId, group) both end in usePipelineStore's set({ deals: ... }); usePipelineGroups() is a useMemo keyed on deals (unchanged from 01-03) so any deals array replacement re-derives all 5 groups and re-renders every GroupSection/DealTable from the same store subscription — no new state channel was introduced by this plan that could bypass that path"
        status: pass
    human_judgment: false
  - id: D7
    description: "A human, in the actual running board, clicks Add Deal and submits a new deal into Lead (confirms it appears under Lead immediately and the modal closes), then uses that deal's row Select to move it to Opportunity (confirms it relocates with no page reload), then tries submitting Add Deal with a required field empty (confirms it is blocked with a visible inline error)"
    requirement: "PIPE-02, DEAL-01"
    verification: []
    human_judgment: true
    rationale: "This plan's Task 3 <verify> block declares this exact sequence as a <human-check>, not an <automated> check — it is explicit interactive UI verification (real mouse/keyboard interaction against a rendered, running app) that no tool available in this non-browser execution environment can perform. D1 through D6 above give strong automated/code-inspection evidence that the underlying mechanism is correct (schema, submit gating, store wiring, data-flow re-render path, clean build, clean dev-server module transforms), but per this plan's own frontmatter this specific interactive click-through must still be confirmed by a human before being treated as done."

duration: 25min
completed: 2026-09-07
status: complete
---

# Phase 01 Plan 04: Add Deal Modal and Stage-Move Control Summary

**Built the Add Deal modal form (D-01 through D-04) and the per-row Stage-move `<Select>` control (RESEARCH.md Pattern 3), then wired both into the 01-03 pipeline board — `PipelineBoard` now has a working "Add Deal" button and every `DealTable` row has a stage-move control, completing every requirement (PIPE-01, PIPE-02, DEAL-01) this phase set out to deliver. This is the final plan in Phase 1 — Phase 1 is now complete, pending the human verification items flagged below.**

## Performance
- **Duration:** ~25min active execution
- **Started:** 2026-09-07T11:48 (base checkout; `npm install`, node_modules absent in this fresh worktree)
- **Completed:** 2026-09-07T11:56 (Task 3 commit)
- **Tasks:** 3 completed (all `type="auto"`)
- **Files modified:** 5 files (3 created, 2 modified)

## Accomplishments
- `add-deal-schema.ts` exports `addDealSchema` (zod) requiring Name, Company, Value (positive), Owner, Close Date, and a 5-value Stage enum — the single source of validation for the Add Deal form and the shape it produces
- `AddDealDialog.tsx` — a shadcn `Dialog` + `react-hook-form` modal using this project's *actual* generated `Field`/`FieldLabel`/`FieldError` composition (via `Controller`, not the empty `form.tsx` placeholder RESEARCH.md warned might not exist) — on valid submit calls `usePipelineStore().addDeal(values)` and closes immediately (D-04); on invalid submit blocks the store call and shows inline errors without closing (verified by code inspection of the RHF `handleSubmit`/`zodResolver` gating, since this environment has no browser to click through)
- `StageSelect.tsx` — a per-row shadcn `Select` pre-set to the deal's current group, calling `usePipelineStore.getState().moveStage(dealId, group)` on change — the "ship the simpler mechanism first" path from 01-CONTEXT.md, with zero `@dnd-kit`/drag-and-drop code
- `PipelineBoard.tsx` now owns an "Add Deal" button and the `useState<boolean>` open flag driving `AddDealDialog`; `DealTable.tsx`'s `columns` array now ends with a `columnHelper.display()` column rendering `StageSelect` per row
- Resolved a real TypeScript mismatch RESEARCH.md's cited code block didn't anticipate: `z.coerce.number()` makes `addDealSchema`'s input type diverge from its `z.infer` output type, breaking `useForm<AddDealFormValues>` against `zodResolver`. Fixed with react-hook-form's 3-generic `useForm<TFieldValues, TContext, TTransformedValues>` form and a new `AddDealFormInput` (`z.input`) type threaded through the form state
- `npm run build` exits 0 after every task; `grep -rlE "axios|XMLHttpRequest" src/features/pipeline` returns 0 matches; the dev server (port 5199) served the app cleanly and every new/edited module transformed with no errors; the dev server was fully terminated (port confirmed free via `Get-NetTCPConnection`) before this plan concluded

## Task Commits
1. **Task 1: AddDealDialog — modal form implementing D-01 through D-04** — `caa5f88` (feat)
2. **Task 2: StageSelect — per-row stage-move control** — `be5ede5` (feat)
3. **Task 3: Wire AddDealDialog and StageSelect into the board** — `2a2a10e` (feat)

## Files Created/Modified
- `src/features/pipeline/components/add-deal-schema.ts` — `addDealSchema`, `AddDealFormValues` (output type, per plan), `AddDealFormInput` (input type, added to resolve the RHF/zodResolver type mismatch)
- `src/features/pipeline/components/AddDealDialog.tsx` — `AddDealDialog`, the Add Deal modal form
- `src/features/pipeline/components/StageSelect.tsx` — `StageSelect`, the per-row stage-move control
- `src/features/pipeline/components/PipelineBoard.tsx` — Add Deal button + `AddDealDialog` open/close wiring
- `src/features/pipeline/components/DealTable.tsx` — trailing `StageSelect` display column

## Decisions Made
See `key-decisions` in frontmatter above for the full list with rationale. Summary: added `AddDealFormInput` alongside the plan-specified `AddDealFormValues` to make `z.coerce.number()`'s input/output split type-check against `zodResolver` via react-hook-form's 3-generic `useForm`; cast the Value field's controlled `value` prop since its pre-coercion type is `unknown`; used `columnHelper.display()` (not `.accessor()`) for the trailing Stage column since it needs the whole `Deal`, not one field; `PipelineBoard` owns the Add Deal button/open-state per D-03, keeping `AddDealDialog` a fully controlled component with no internal trigger.

## Deviations from Plan

**[Rule 1 - Bug/type mismatch] `z.coerce.number()` breaks `useForm<AddDealFormValues>` against `zodResolver`, as literally written in RESEARCH.md's cited code block**
- Found during: Task 1 (`AddDealDialog.tsx`)
- Issue: `npm run build` failed with `TS2322`/`TS2345` — `addDealSchema`'s `value: z.coerce.number()...` makes the schema's pre-parse input type `unknown` for that field while `z.infer`'s output type is `number`. `useForm<AddDealFormValues>({ resolver: zodResolver(addDealSchema) })`, exactly as RESEARCH.md's Code Examples show it, does not type-check: `zodResolver`'s `Resolver` type parameter expects the schema's *input* shape to match `TFieldValues`, but `AddDealFormValues` (the *output* shape) has `value: number`, not `unknown`.
- Fix: Added `AddDealFormInput = z.input<typeof addDealSchema>` to `add-deal-schema.ts` (additive — `addDealSchema` and `AddDealFormValues` remain exactly as the plan specifies), and switched `AddDealDialog.tsx` to react-hook-form 7.86's three-generic `useForm<AddDealFormInput, unknown, AddDealFormValues>(...)` form, where the third generic (`TTransformedValues`) is what `handleSubmit`'s callback receives post-resolver — restoring `onSubmit(values: AddDealFormValues)`'s original signature unchanged. Also cast the Value field's controlled `value` prop (`(field.value as string | number | undefined) ?? ""`) since `AddDealFormInput`'s `value` is `unknown` pre-coercion and the native `<input value>` prop rejects `unknown`.
- Files modified: `src/features/pipeline/components/add-deal-schema.ts`, `src/features/pipeline/components/AddDealDialog.tsx`
- Verification: `npm run build` exits 0 with no type errors; `addDealSchema`'s validation rules and `AddDealFormValues`'s shape are byte-for-byte what the plan's Task 1 action specifies — only an additional type and a form-typing strategy were added, no requirement or acceptance criterion changed.
- Commit hash: `caa5f88`

**Total deviations:** 1 auto-fixed (Rule 1 — TypeScript type-inference mismatch between a coercing zod schema and react-hook-form's resolver typing). **Impact:** none on delivered behavior, validation rules, or any stated acceptance criterion — the fix is purely additional typing to make the plan's exact specified schema and form values compile together with the installed `react-hook-form@7.86.0`/`zod@4.4.3`/`@hookform/resolvers@5.9.1` versions.

## Issues Encountered
None beyond the type-inference deviation documented above. `node_modules` was absent in this fresh worktree as expected; `npm install` completed cleanly (523 packages, 0 vulnerabilities) before any task work began.

## PIPE-02 / DEAL-01 Flagged Assumptions — Carried Forward, Not Resolved

01-04-PLAN.md's frontmatter records that the deterministic edge-probe returned **both PIPE-02 and DEAL-01 as `unclassified`/`unresolved`** — it could not auto-derive acceptance edges from either requirement's text. Per the spec-less probe fallback protocol, this stays unresolved rather than being silently auto-resolved just because all 3 tasks completed and their stated acceptance criteria passed. This SUMMARY does not treat that completion as resolving the edge-probe flags. Specifically carried forward for human confirmation at verify time:

- **PIPE-02:** the plan's own "Reasoned judgment of done" note is satisfied structurally (StageSelect immediately relocates a deal between `GroupSection`s with no full-page reload, via the same `deals[]` → `usePipelineGroups()` → re-render path 01-03 established) — but a human should confirm a dropdown-based move satisfies "move a deal from one pipeline stage to another," since 01-RESEARCH.md flags drag-and-drop as an acceptable-but-not-required Phase 2+ alternative, not a Phase 1 requirement.
- **Deliberate scope boundary — Lost-move requires no reason this phase:** moving a deal directly into the "Lost" group via `StageSelect` (or adding a new deal directly as Lost via `AddDealDialog`'s stage selector) requires **zero** friction — no reason prompt, no gate. `LOST-01`'s required-reason gate is explicitly Phase 3's job per ROADMAP.md. A human should confirm this ungated Lost-move is acceptable for a Phase 1 demo rather than expecting Phase 3's gate to already exist.
- **DEAL-01:** the modal enforces all 5 required fields + stage selector (D-01/D-02) as a true modal (D-03), and closes while the new deal appears immediately in its selected group on valid submit (D-04); invalid submits are blocked with inline errors without closing. A human should confirm the validation behavior — specifically the exact wording/placement of the inline error messages, which no source artifact specifies beyond the zod messages authored in Task 1 (`"Name is required"`, `"Value must be positive"`, etc.) — matches their expectations. This confirmation requires the interactive click-through captured as coverage item D7 above (`human_judgment: true`), which this non-browser execution environment cannot perform itself.

## User Setup Required
None — no external service configuration required.

## Dev Server Verification
`npm run dev -- --port 5199 --strictPort` was started in the background for Task 3's `<automated>` verification steps: `node fetch('http://localhost:5199')` returned `200` and the raw HTML confirmed the expected SPA shell; every module touched this plan (`AddDealDialog.tsx`, `StageSelect.tsx`, `DealTable.tsx`, `PipelineBoard.tsx`) was fetched directly from the dev server and returned `200` with no transform errors. The listening process was located via PowerShell's `Get-NetTCPConnection -LocalPort 5199` and terminated with `Stop-Process -Force`; port 5199 was confirmed free (`PORT FREE`) immediately after — no lingering dev-server process was left running.

## Next Phase Readiness
Phase 1 (Pipeline Board Foundation) is now feature-complete: all three requirements (PIPE-01, PIPE-02, DEAL-01) have shipped code behind them, `npm run build` exits 0 on the full board including the write paths, and no network call exists anywhere in `src/features/pipeline` — everything resolves through `usePipelineStore` → `MockDealsRepository`. **Phase 1 complete, ready for verification** — there is no 01-05; the next step is the phase-level human verification pass (interactive click-through per coverage D7 above, plus 01-03's still-open anti-clone visual-identity judgment call) before Phase 1 is marked done in STATE.md/ROADMAP.md by the orchestrator.

---
*Phase: 01-pipeline-board-foundation*
*Completed: 2026-09-07*
