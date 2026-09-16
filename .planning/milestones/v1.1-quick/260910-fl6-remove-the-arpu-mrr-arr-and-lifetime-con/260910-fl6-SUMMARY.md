---
phase: 260910-fl6-remove-the-arpu-mrr-arr-and-lifetime-con
plan: 1
subsystem: pipeline-board
tags: [add-deal-wizard, deal-metrics, derived-values, pipeline-table]
dependency-graph:
  requires: [260910-ec8]
  provides: [deal-metrics-utility, derived-financial-columns]
  affects: [add-deal-wizard, deal-type, mock-deals-repository, seed-data, pipeline-table]
tech-stack:
  added: []
  patterns: ["Pick<Deal, ...>-typed pure derived-value functions (mirrors sumLineItems/hasManualOverride)"]
key-files:
  created:
    - src/shared/utils/deal-metrics.ts
  modified:
    - src/features/pipeline/components/AddDealDialog.tsx
    - src/features/pipeline/components/add-deal-schema.ts
    - src/shared/types/deal.ts
    - src/data/mock/mock-deals-repository.ts
    - src/data/mock/seed-data.ts
    - src/features/pipeline/components/DealTable.tsx
decisions:
  - "MRR/ARR/Lifetime Contract Value/ARPU are purely derived, never stored on Deal — same 'never stale' contract as Phase 2's sumLineItems for Deal.value"
  - "ARPU renders an em dash (not 0/NaN/Infinity) when a deal has zero line items, reusing EditableCell.tsx's existing empty-cell convention"
  - "New columns use columnHelper.display() (not .accessor()) since none of the 4 values is a literal Deal property"
metrics:
  duration: "~25 minutes"
  completed: 2026-09-10
status: complete
actuals:
  tokens: 27000
  tasks: 2
  commits: 2
---

# Phase 260910-fl6 Plan 1: Remove ARPU/MRR/ARR/Lifetime Contract Value manual inputs, add derived table columns Summary

Reverted quick task 260910-ec8's 4 manually-entered financial-metric wizard fields and replaced them with a pure derived-value utility (`deal-metrics.ts`) computing MRR, ARR, Lifetime Contract Value, and ARPU on demand from a deal's `value`/`frequency`/`contractTermMonths`/`lineItems`, displayed as 4 new pipeline-table columns.

## What Was Built

**Task 1 — Revert the 4 financial-field wizard inputs and stored fields** (commit `e039f97`)
- `AddDealDialog.tsx`: removed the `useEffect`/`useWatch`/`FieldDescription` imports, the 4 `DEFAULT_VALUES` entries, the MRR-driven live auto-calc effect, and the 4 Controller blocks (ARPU/MRR/ARR/Lifetime Contract Value). Customer Type and Confidence Level Controllers/options untouched. File shrank from 520 to 399 lines.
- `add-deal-schema.ts`: removed the 4 `z.coerce.number()...optional()` chains from `addDealStep2Schema`, leaving `confidenceLevel` as the last field.
- `deal.ts`: removed `arpu`/`mrr`/`arr`/`lifetimeContractValue` from both `Deal` and `NewDealInput`; rewrote both doc comments to note the 4 values are now derived by `deal-metrics.ts`, never stored.
- `mock-deals-repository.ts`: removed the 4-field pass-through from `create()`, keeping `customerType`/`confidenceLevel`.
- `seed-data.ts`: removed the hoisted `mrr` const and the 4 financial-field return-object lines; inlined `contractTermMonths` directly into the return object since it no longer needs to be hoisted.

**Task 2 — Derived-value utility + 4 new pipeline-table columns** (commit `e988507`)
- Created `src/shared/utils/deal-metrics.ts`, a sibling to `line-items.ts` following its exact convention (named exports, pure functions, `Pick<Deal, ...>` parameter types, file-header "never stored, always derived" doc comment). Exports `computeMrr`, `computeArr`, `computeLifetimeContractValue`, and `computeArpu` (returns `null`, never 0/NaN/Infinity, when a deal's line items sum to 0 units).
- `DealTable.tsx`: added a module-level `currencyFormatter` (matching `EditableCell.tsx`'s exact `Intl.NumberFormat` construction) and 4 new `columnHelper.display()` columns — MRR, ARR, Lifetime Contract Value, ARPU — inserted after Close Date and before Stage. ARPU's cell reuses the existing `"—"` em-dash convention for the zero-line-items case.

## Deviations from Plan

None — plan executed exactly as written. Precondition verified against RESEARCH.md's documented line-level state before any edit.

## Verification

- `npm run build` (`tsc -b && vite build`) exits 0 after both tasks — zero type errors, confirming all 40 seed deals satisfy the trimmed `Deal` type.
- `npm run lint` (scoped to the 7 files this plan touched, via `npx eslint <files>`) — zero errors/warnings. (Repo-wide `npm run lint` reports pre-existing errors in unrelated `.claude/gsd-core` tooling files and 2 pre-existing warnings in `button.tsx`/`LineItemsTable.tsx`, none touched by this plan — out of scope per the deviation rules' scope boundary.)
- `grep -c "customerType"` across the 5 Task-1 files sums to 8 (≥5 required) — Customer Type/Confidence Level confirmed untouched.
- `AddDealDialog.tsx` is 399 lines (<450 required).
- `deal-metrics.ts` exports exactly 4 `compute*` functions.
- `DealTable.tsx` has exactly 7 `columnHelper.display(...)` calls (expand, mrr, arr, lifetimeContractValue, arpu, stage, id).

Human-check items from the plan's `<verify>` blocks (visual confirmation of the wizard's 7-field step 2 and the 4 new live-computed table columns) were not run in this autonomous, no-browser execution — the automated checks above are the strongest available signal and all pass.

## Known Stubs

None.

## Threat Flags

None — the 3 threats in this plan's `<threat_model>` were all dispositioned `mitigate`/`accept` at plan time with no new untrusted-input surface introduced by the actual implementation (matches the plan's threat register exactly: financial-input surface was removed, not added; `PERIOD_MONTHS` is exhaustively typed over `DealFrequency`'s 5 members; the 4 new columns expose no data beyond what `value`/`frequency`/`contractTermMonths`/`lineItems` already exposed).

## Self-Check: PASSED

- FOUND: src/shared/utils/deal-metrics.ts
- FOUND: src/features/pipeline/components/AddDealDialog.tsx (399 lines, matches acceptance criteria)
- FOUND: src/features/pipeline/components/add-deal-schema.ts
- FOUND: src/shared/types/deal.ts
- FOUND: src/data/mock/mock-deals-repository.ts
- FOUND: src/data/mock/seed-data.ts
- FOUND: src/features/pipeline/components/DealTable.tsx
- FOUND commit e039f97 (Task 1)
- FOUND commit e988507 (Task 2)
- `npm run build` exits 0 (verified twice, once per task and once at the end)
- `npm run lint` scoped to modified files exits 0
