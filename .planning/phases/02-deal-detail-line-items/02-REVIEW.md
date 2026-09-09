---
phase: 02-deal-detail-line-items
reviewed: 2026-09-08T00:00:00Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - src/components/ui/sheet.tsx
  - src/data/deals-repository.ts
  - src/data/mock/mock-deals-repository.ts
  - src/data/mock/seed-data.ts
  - src/features/pipeline/components/DealDetailDrawer.tsx
  - src/features/pipeline/components/DealTable.tsx
  - src/features/pipeline/components/EditableCell.tsx
  - src/features/pipeline/components/GroupSection.tsx
  - src/features/pipeline/components/LineItemsTable.tsx
  - src/features/pipeline/components/PipelineBoard.tsx
  - src/features/pipeline/components/StageSelect.tsx
  - src/features/pipeline/components/deal-edit-schema.ts
  - src/features/pipeline/store/pipelineStore.ts
  - src/shared/types/deal.ts
  - src/shared/utils/line-items.ts
findings:
  critical: 1
  warning: 2
  info: 1
  total: 4
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-09-08T00:00:00Z
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

Reviewed the deal-detail-drawer and line-items slice (plans 02-01 and 02-02): the Sheet primitive, the repository/store widening for `updateDeal`, seed data, and the five feature components (`DealDetailDrawer`, `DealTable`, `EditableCell`, `GroupSection`, `LineItemsTable`, `StageSelect`) plus their supporting schema/derived-value modules.

The drawer's own core-field form (`DealDetailDrawer.tsx`) correctly wires `dealEditSchema` through `Controller`/`fieldState.invalid` and blocks invalid commits, matching the plan's must_haves. However, the pipeline table's inline editor (`EditableCell.tsx`) — which 02-01-PLAN.md's must_haves explicitly require to "reuse the create-time positive-value constraint on Value" and "reuse the required-non-empty validation ... for Name/Owner/Close Date, so clearing one to empty and committing is rejected client-side and never persisted" — implements **no validation at all**. This is a real, reproducible defect: clearing the Close Date cell to empty and blurring persists `closeDate: ""`, and the very next render of that cell throws (`date-fns`'s `format(parseISO(""))` raises `RangeError: Invalid time value`), which — the app has no `ErrorBoundary` — crashes the entire React tree. The same gap also lets Name/Owner be committed as empty strings and Value be committed as zero/negative, silently, with no error shown.

Two further, lower-severity issues: the drawer's "Reset to sum" button bypasses the file's own commit/error/guard pattern, and the `"Update failed…"` message plus each file's `currencyFormatter` are copy-pasted verbatim across multiple files instead of shared.

## Critical Issues

### CR-01: `EditableCell` has no input validation — persists invalid state and can crash the app via an empty Close Date

**File:** `src/features/pipeline/components/EditableCell.tsx:39-108` (crash trigger at line 49; commit path at lines 73-88)

**Issue:** `EditableCell`'s `commit()` handler sends the raw `draft` straight to `updateDeal` with no schema check:

```tsx
const commit = async () => {
  setIsEditing(false);
  if (isPending || draft === lastCommitted) return;
  setIsPending(true);
  try {
    await usePipelineStore.getState().updateDeal(dealId, {
      [columnId]: columnId === "value" ? Number(draft) : draft,
    });
    ...
```

There is no import of `dealEditSchema` and no `min(1)`/`positive()` equivalent check anywhere in this file. This directly contradicts 02-01-PLAN.md's must_haves for this exact task ("Inline core-field edits reuse the create-time positive-value constraint on Value ... so committing zero or a negative value is rejected client-side and never persisted (DEAL-02 boundary)"; "Inline edits reuse the required-non-empty validation from creation for Name/Owner/Close Date ... rejected client-side and never persisted (DEAL-02 empty)") and diverges from `DealDetailDrawer.tsx`, whose `Controller`/`fieldState.invalid` guard on every field correctly blocks the same invalid inputs.

Concretely reachable consequences:
- **Crash:** click into a row's Close Date cell (native `<input type="date">`), clear it via the browser's built-in clear control, blur. `draft = ""` is committed. On re-render, `displayText` is computed unconditionally at the top of the component (line 45-50, *before* the `isEditing` branch, so it runs even for other cells/renders once this deal's `closeDate` is `""`):
  ```tsx
  const displayText = ... : format(parseISO(String(value)), "MMM d, yyyy") ...
  ```
  `parseISO("")` returns an Invalid Date, and `format()` on it throws `RangeError: Invalid time value` (verified directly against the project's installed `date-fns`). There is no `ErrorBoundary` anywhere in `src/`, so this unmounts the whole app (white screen) for every subsequent render that touches this deal.
- **Silent bad data:** clearing Name or Owner to `""` and blurring persists an empty string with no error shown (violates DEAL-02 empty). The drawer's `SheetTitle` and the table's Name cell then render blank with no indication anything went wrong.
- **Silent bad data:** typing `0` or a negative number into the Value cell and blurring persists it as-is (violates DEAL-02 boundary) — `GroupSection`'s stage totals and `hasManualOverride`'s divergence check both silently absorb the bad value instead of rejecting it.

**Fix:** Validate `draft` against the same per-field rule the drawer uses before committing (and reject/revert with the existing error banner on failure), and defensively guard the date formatter so a bad value can never crash the render even if it's already in the store from an earlier bug/seed:

```tsx
import { dealEditSchema } from "@/features/pipeline/components/deal-edit-schema";

// in commit():
const parsed = dealEditSchema.shape[columnId].safeParse(
  columnId === "value" ? Number(draft) : draft,
);
if (!parsed.success) {
  setDraft(lastCommitted);
  setError(parsed.error.issues[0]?.message ?? UPDATE_FAILED_MESSAGE);
  return; // never calls updateDeal
}

// in displayText, make the formatter crash-proof regardless:
columnId === "closeDate"
  ? (value ? format(parseISO(String(value)), "MMM d, yyyy") : "—")
  : ...
```

## Warnings

### WR-01: "Reset to sum" bypasses the drawer's own error-handling/guard pattern

**File:** `src/features/pipeline/components/DealDetailDrawer.tsx:201-212`

**Issue:** Every other commit in this file goes through `commitField()`, which sets a per-field pending flag, catches rejections, reverts the field, and shows the `UPDATE_FAILED_MESSAGE` banner. The "Reset to sum" button instead calls the store directly, fire-and-forget:

```tsx
<Button
  ...
  onClick={() => void usePipelineStore.getState().updateDeal(dealId, { value: computed })}
>
```

If this `updateDeal` call rejects (the same rejection path every other field explicitly handles), the failure is only logged via the store's internal `console.error` — the user sees no error banner, the button isn't disabled while in flight, and nothing reverts. It's also not guarded against a rapid double-click firing two overlapping requests.

**Fix:** Route this through the same `commitField`-style helper (or a small dedicated `pendingFields`-aware wrapper) so a failure surfaces the existing "Update failed" banner and the button disables while in flight, consistent with the rest of the file.

### WR-02: `UPDATE_FAILED_MESSAGE` is copy-pasted verbatim in three files

**File:** `src/features/pipeline/components/DealDetailDrawer.tsx:31`, `src/features/pipeline/components/EditableCell.tsx:12`, `src/features/pipeline/components/LineItemsTable.tsx:31`

**Issue:** The exact same string literal (`"Update failed — your change wasn't saved. Try again."`) is independently declared as a local constant in three different files instead of being imported from one shared location. A future copy change (or localization) requires editing all three in lockstep, and it's easy for one to drift.

**Fix:** Hoist the constant into a shared module (e.g. `src/features/pipeline/constants.ts` or alongside `deal-edit-schema.ts`) and import it from all three call sites.

## Info

### IN-01: `currencyFormatter` is redeclared identically in four files

**File:** `src/features/pipeline/components/GroupSection.tsx:7-11`, `src/features/pipeline/components/DealDetailDrawer.tsx:33-37`, `src/features/pipeline/components/EditableCell.tsx:5-9`, `src/features/pipeline/components/LineItemsTable.tsx:23-27`

**Issue:** The identical `new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })` instance is constructed separately in four modules. Harmless functionally, but it's duplicated formatting logic that should live in one place so a future currency/locale change doesn't require hunting down every copy.

**Fix:** Move to a shared `src/shared/utils/format.ts` (or similar) exporting a single `currencyFormatter` and import it everywhere it's used.

---

_Reviewed: 2026-09-08T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
