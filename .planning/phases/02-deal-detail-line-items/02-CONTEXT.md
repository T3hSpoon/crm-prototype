# Phase 2: Deal Detail & Line Items - Context

**Gathered:** 2026-09-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can manage a deal's full details, including its product/service line-item composition. Concretely: a detail view opened from a pipeline-table row showing the deal's full information; inline editing of a deal's core fields (name, value, owner, close date) directly in the pipeline table without leaving the board; adding, editing, and removing line items (product/service, SKU, units, unit price, subtotal, type) on a deal from the detail view; and a deal's total value defaulting to the sum of its line items with the option to manually override it. Covers requirements DEAL-02, DEAL-03, DEAL-04, DEAL-05. No lost-reason gating, no forecast page, no search/filter/sort — those are Phases 3-4.

</domain>

<decisions>
## Implementation Decisions

### Detail View Layout & Trigger
- **D-01:** The deal detail view is a side drawer/panel (slides in from the side), not a modal dialog and not a separate full page/route. The pipeline board stays visible behind it. Matches project research's explicit recommendation over a separate page for a prototype.
- **D-02:** Clicking anywhere on a deal's row in the pipeline table opens its detail drawer — no separate "view" icon/button. Must not conflict with the row's existing Stage Select click target (Phase 1); the Stage Select's own click area should stop propagation so it doesn't also trigger the drawer.
- **D-03:** The detail drawer stays open after an edit — it does not auto-close the way Phase 1's Add Deal modal closes on submit. A user can make several field edits and line-item changes in one visit before explicitly closing it.

### Claude's Discretion
The user chose to discuss only "Detail view layout & trigger" this round. The following gray areas were presented but not discussed — Claude/researcher/planner have discretion, informed by the research already on file (see Canonical References):

- **Inline core-field editing UX (in the pipeline table)** — no constraint given on the exact trigger mechanism (click-to-edit vs. dedicated edit icon) or save behavior. `research/FEATURES.md` confirms inline edit belongs on "the handful of fields that matter (name, value, owner, stage, close date)" directly in the table, with line items and less-frequent fields reserved for the drawer (D-01 above). Default to click-to-edit-in-place (click the cell, it becomes an input, save on blur/Enter, Escape cancels) — the lowest-friction, most conventional pattern, consistent with the "no full spreadsheet-grade editing" scope boundary in REQUIREMENTS.md's Out of Scope list.

- **Line-item add/edit/remove UX (inside the drawer)** — no constraint given on the exact interaction mechanism. `research/PITFALLS.md` Pitfall 2 already locks the data shape (`Deal.lineItems: LineItem[]`, one level only, no self-referential nesting, id-based addressing — not a gray area, already decided). What remains open is purely the UI mechanism: default to an inline-editable mini-table (reusing the same headless-table + inline-cell-edit pattern as the pipeline table) with an "Add Line Item" button appending a new editable row and a per-row remove control. Each line item's `id` must be assigned the same way deals are (`crypto.randomUUID()`), never an array index (per PITFALLS.md Pitfall 5, which applies equally to line items).

- **Value override behavior (auto-sum vs. manual)** — **research explicitly flags this as needing an explicit decision** (`research/FEATURES.md`: "worth flagging as a design decision to make explicit rather than silently supporting both"), and the user chose not to discuss it this round — so this is a genuine judgment call being made without user sign-off, not a settled decision. Researcher/planner should feel free to revisit this with the user at plan time if it doesn't sit right. Claude's working approach, absent further input: the Value field stays directly editable at all times; typing a different number into it counts as a manual override. While the current value still equals the computed line-item sum (i.e., never been manually overridden, or a prior override happens to match), the value keeps auto-tracking the sum as line items change. Once the value diverges from the computed sum (a real manual override), line-item edits stop silently overwriting it — instead, show a small "Reset to sum ($X)" affordance next to the Value field whenever it differs from the computed sum, letting the user snap back explicitly. This is a common "computed-until-touched" pattern; it avoids ever silently discarding a value the user typed on purpose.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope & requirements
- `.planning/PROJECT.md` — core value, active/validated requirements, out-of-scope list, locked key decisions
- `.planning/REQUIREMENTS.md` — DEAL-02 through DEAL-05 requirement text and traceability; Out of Scope table explicitly excludes "full spreadsheet-grade inline editing (every cell, keyboard nav, copy/paste, undo)" — inline edit here is limited to the handful of core fields, not a general grid
- `.planning/ROADMAP.md` — Phase 2 goal, 4 success criteria, dependency on Phase 1

### Architecture & data model
- `.planning/research/ARCHITECTURE.md` — `DealDetailPanel` + `LineItemsTable` component shape (lines ~42, ~61-62), edits dispatch store actions (`updateDeal`, `addLineItem`) that call the repository — never mutate props/state directly; line items live as a field on `Deal`, not a separate repository (line ~247)
- `.planning/research/PITFALLS.md` — critical for this phase: Pitfall 2 (cap line-item nesting at exactly one level, model as a plain array, decide up front what happens to line items on stage-move [they move with the deal] and on lost [retained, not deleted] — the lost case is Phase 3's concern but the data shape must not preclude it), Pitfall 4/5 (never store a derived value like `subtotal`/deal-total in the mock data itself — compute at render/selector time; address every deal and line item by stable `id`, never array index), Pitfall 6 (whole-table re-render / stale-index bugs under inline editing — memoize row/cell components, update by id lookup not index scan)
- `.planning/research/FEATURES.md` — line-item and detail-view feature framing (lines 19-20, 37, 62-63, 92, 104-149); explicitly flags value-override as needing an explicit design decision (line 37, restated in Claude's Discretion above)

### Prior phase (Phase 1) — what this phase builds on
- `.planning/phases/01-pipeline-board-foundation/01-CONTEXT.md` — Phase 1's own decisions (add-deal form scope, stage-move mechanism) and Claude's Discretion items
- `.planning/phases/01-pipeline-board-foundation/01-02-SUMMARY.md` — the `Deal` type, `DealsRepository` interface, `MockDealsRepository`, and `usePipelineStore` shape this phase extends
- `.planning/phases/01-pipeline-board-foundation/01-03-SUMMARY.md` — `DealTable.tsx`'s actual `@tanstack/react-table` usage: it imports from the package's `/legacy` compat subpath (`useLegacyTable`, `legacyCreateColumnHelper`, `getCoreRowModel`) because v9's default API broke the v8-era shape research assumed — any new table code in this phase (line-items sub-table, inline-edit cells) MUST use the same `/legacy` subpath for consistency, not the v9-native API
- `.planning/phases/01-pipeline-board-foundation/01-04-SUMMARY.md` — `AddDealDialog.tsx`'s react-hook-form + zod + shadcn Dialog pattern (including the `AddDealFormInput`/`AddDealFormValues` two-generic `useForm` workaround for `z.coerce.number()`) — reuse this pattern for the detail drawer's edit form(s) and line-item validation
- `.planning/STATE.md` — Accumulated Context / Blockers section notes `01-REVIEW.md`'s open (non-blocking) findings: `moveStage`/`addDeal` don't handle a rejected repository promise, no double-submit guard on Add Deal. Worth applying the same fix pattern to this phase's new `updateDeal`/line-item store actions from the start rather than repeating the gap.

### Tech stack
- `.claude/CLAUDE.md` (Technology Stack section) — React 19.2, TypeScript, Vite 8, `@tanstack/react-table`, Zustand, Tailwind + shadcn/ui, react-hook-form + zod. No drawer/sheet primitive has been generated yet — `npx shadcn@latest add sheet` (or equivalent) will be needed for D-01's side-drawer layout.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/shared/types/deal.ts` — `Deal`, `PipelineStage`, `DealOutcome`, `PipelineGroup`, `NewDealInput`. This phase adds a `LineItem` type and a `lineItems: LineItem[]` field on `Deal` (per ARCHITECTURE.md), plus whatever field(s) express "value has been manually overridden" for the Claude's Discretion item above.
- `src/data/deals-repository.ts` / `src/data/mock/mock-deals-repository.ts` / `src/data/index.ts` — the `DealsRepository` interface and its mock implementation; `update()` is already id-based. Extend `update()`'s patch shape (or add a dedicated line-item method) rather than creating a second repository.
- `src/features/pipeline/store/pipelineStore.ts` — `usePipelineStore` (`deals`, `status`, `load`, `addDeal`, `moveStage`). This phase adds actions like `updateDeal`/line-item mutations, following the exact same "await repository call, then patch state by id" pattern already established by `moveStage`.
- `src/features/pipeline/components/DealTable.tsx` — existing headless table using `@tanstack/react-table`'s `/legacy` subpath; reuse the same pattern for any new tabular UI (line items) or inline-edit cell renderers.
- `src/features/pipeline/components/add-deal-schema.ts` + `AddDealDialog.tsx` — established react-hook-form + zod + shadcn form pattern, including the two-generic `useForm` fix for `z.coerce.number()`. Reuse for the detail drawer's field-edit form and line-item validation schema.
- `src/components/ui/{button,dialog,field,input,label,select,separator}.tsx` — shadcn primitives already generated. No `sheet`/drawer primitive exists yet — needs generating this phase for D-01.
- `src/shared/utils/pipeline-group.ts` — `toPipelineGroup`/`fromPipelineGroup`, available if the detail drawer needs to read/display a deal's current group.

### Established Patterns
- Repository seam: components/store never import `mock-deals-repository.ts` directly, only `src/data/index.ts`'s `dealsRepository` singleton (enforced by a grep gate in Phase 1's plans — expect the same gate this phase).
- All writes go through Zustand store actions that call the repository, never direct state mutation.
- Every entity (`Deal`, and now `LineItem`) is addressed by stable `id` (`crypto.randomUUID()`), never array index.
- Zero network calls anywhere in `src/features/pipeline` or `src/data` — everything resolves through the in-memory mock repository (grep-gated in Phase 1, expect the same this phase).

### Integration Points
- The detail drawer and inline-table editing both write through the same `usePipelineStore` actions the row-level `StageSelect` already uses — no parallel/competing update path.
- `01-REVIEW.md`'s open findings (unhandled promise rejection on repository failure, no double-submit guard) apply directly to this phase's new write actions (`updateDeal`, line-item add/edit/remove) — worth building the fix in from the start rather than repeating the gap identified in Phase 1.

</code_context>

<specifics>
## Specific Ideas

No particular visual or interaction references were given beyond what's already in PROJECT.md (monday.com's Deals board for concept inspiration, not a visual target) and the Phase 1 decisions above (own visual design, not a clone).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. No scope-creep suggestions came up.

</deferred>

---

*Phase: 2-Deal Detail & Line Items*
*Context gathered: 2026-09-07*
