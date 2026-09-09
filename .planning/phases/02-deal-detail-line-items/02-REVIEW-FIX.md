---
phase: 02-deal-detail-line-items
fixed_at: 2026-09-08T07:44:24Z
review_path: C:/gh-repos/eld/.planning/phases/02-deal-detail-line-items/02-REVIEW.md
iteration: 1
findings_in_scope: 3
fixed: 3
skipped: 0
status: all_fixed
---

# Phase 02: Code Review Fix Report

**Fixed at:** 2026-09-08T07:44:24Z
**Source review:** C:/gh-repos/eld/.planning/phases/02-deal-detail-line-items/02-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 3 (fix_scope: critical_warning — CR-01, WR-01, WR-02; IN-01 excluded)
- Fixed: 3
- Skipped: 0

**Verification environment:** All fixes were made and committed inside an isolated git worktree (`.claude/worktrees/rf-02-16145-1788853315`, branch `gsd-reviewfix/02-16145`) created for this run per the `setup_worktree` protocol. The worktree has no `node_modules` installed (by design — dependency installation is not part of this agent's job), so Tier 2 syntax/type checks (`tsc --noEmit`) were **not available**; every fix below was verified via Tier 1 (re-read modified file, confirm fix text present and surrounding code intact) only. The worktree's commits were fast-forwarded onto the original branch during cleanup, so these commits are reproducible from the main checkout — but a `tsc`/build check was not run as part of this report and should be covered by the phase's normal build/verify step.

## Fixed Issues

### CR-01: `EditableCell` has no input validation — persists invalid state and can crash the app via an empty Close Date

**Files modified:** `src/features/pipeline/components/EditableCell.tsx`
**Commit:** 16caad6
**Applied fix:** Imported `dealEditSchema` and, in `commit()`, ran `dealEditSchema.shape[columnId].safeParse(candidate)` before calling `updateDeal` — on failure, the draft reverts to `lastCommitted` and the field shows the schema's own message, and `updateDeal` is never called. On success, the parsed/coerced value (`parsed.data`) is sent instead of the raw draft, and the error is cleared. Also made the Close Date `displayText` formatter crash-proof: `format(parseISO(...))` is now only called when `value` is truthy, falling back to `"—"` otherwise, so an already-invalid/empty value in the store (e.g. from a prior bug or bad seed) can never throw during render.

### WR-01: "Reset to sum" bypasses the drawer's own error-handling/guard pattern

**Files modified:** `src/features/pipeline/components/DealDetailDrawer.tsx`
**Commit:** 0716190
**Applied fix:** The "Reset to sum" button's `onClick` now calls `form.setValue("value", computed)` followed by `void commitField("value", computed)` instead of calling `usePipelineStore.getState().updateDeal(...)` directly. This routes it through the same `commitField` helper every other field commit uses, so a rejected update surfaces the existing "Update failed" banner and reverts the field, and the button is now `disabled={pendingFields.has("value")}` — consistent with the Value input's own disabled state — guarding against a rapid double-click firing overlapping requests.

### WR-02: `UPDATE_FAILED_MESSAGE` is copy-pasted verbatim in three files

**Files modified:** `src/features/pipeline/constants.ts` (new), `src/features/pipeline/components/DealDetailDrawer.tsx`, `src/features/pipeline/components/EditableCell.tsx`, `src/features/pipeline/components/LineItemsTable.tsx`
**Commit:** 3eabd6b
**Applied fix:** Created `src/features/pipeline/constants.ts` exporting a single `UPDATE_FAILED_MESSAGE` constant, removed the three duplicated local declarations, and imported the shared constant into all three files.

## Skipped Issues

None — all in-scope findings were fixed.

---

_Fixed: 2026-09-08T07:44:24Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
