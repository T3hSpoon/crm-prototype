---
phase: 01-pipeline-board-foundation
reviewed: 2026-09-07T00:00:00Z
depth: standard
files_reviewed: 33
files_reviewed_list:
  - README.md
  - components.json
  - eslint.config.js
  - index.html
  - package.json
  - src/app/App.tsx
  - src/components/ui/button.tsx
  - src/components/ui/dialog.tsx
  - src/components/ui/field.tsx
  - src/components/ui/input.tsx
  - src/components/ui/label.tsx
  - src/components/ui/select.tsx
  - src/components/ui/separator.tsx
  - src/data/deals-repository.ts
  - src/data/index.ts
  - src/data/mock/mock-deals-repository.ts
  - src/data/mock/seed-data.ts
  - src/features/pipeline/components/AddDealDialog.tsx
  - src/features/pipeline/components/DealTable.tsx
  - src/features/pipeline/components/GroupSection.tsx
  - src/features/pipeline/components/PipelineBoard.tsx
  - src/features/pipeline/components/StageSelect.tsx
  - src/features/pipeline/components/add-deal-schema.ts
  - src/features/pipeline/hooks/usePipelineGroups.ts
  - src/features/pipeline/store/pipelineStore.ts
  - src/index.css
  - src/lib/utils.ts
  - src/main.tsx
  - src/shared/types/deal.ts
  - src/shared/utils/pipeline-group.ts
  - tsconfig.app.json
  - tsconfig.json
  - tsconfig.node.json
  - vite.config.ts
findings:
  critical: 0
  warning: 5
  info: 5
  total: 10
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-09-07T00:00:00Z
**Depth:** standard
**Files Reviewed:** 33
**Status:** issues_found

## Summary

Reviewed the Phase 1 pipeline-board scaffold: the `Deal`/`pipelineStage`+`outcome` data model, the mock repository seam, the Zustand store, `usePipelineGroups`, and the board/table/dialog UI. `npx tsc -b`, `npx vite build`, and `npx eslint src` were all run against the working tree to corroborate findings rather than relying on static reading alone — the project type-checks and builds cleanly, and the core `toPipelineGroup`/`fromPipelineGroup` derivation logic (the trickiest part of this phase, per the file's own doc comments) is correct for every stage/outcome/lost transition traced by hand.

No critical/security-severity issues were found — this is an in-memory, frontend-only prototype with no network calls, no `dangerouslySetInnerHTML`/`eval`, and no secrets. The issues found are all robustness and quality gaps that matter because this repository/store scaffolding is explicitly designed (per its own doc comments) to be swapped for a real, fallible network API later — and right now nothing in the write path (`addDeal`, `moveStage`) handles a rejected promise, and the store's own `status` field is written but never read by any component.

## Warnings

### WR-01: Stage-move failures are silently unhandled (unhandled promise rejection)

**File:** `src/features/pipeline/components/StageSelect.tsx:33-35` (and `src/features/pipeline/store/pipelineStore.ts:35-41`)
**Issue:** `handleValueChange` calls `void usePipelineStore.getState().moveStage(dealId, group)` and never attaches a `.catch`. `moveStage` awaits `dealsRepository.update(...)`, which rejects (`mock-deals-repository.ts:50-52`) whenever the target id isn't found. Today this can't happen through the UI, but the moment `dealsRepository` is swapped for a real network-backed implementation (the explicit purpose of this repository seam), any failed PATCH — network error, 404, validation error — becomes an unhandled promise rejection: no error is shown to the user, the `<Select>` silently reverts to its previous displayed value on next render, and the failure is only visible as a console warning.
**Fix:**
```ts
// pipelineStore.ts
moveStage: async (dealId, group) => {
  const current = get().deals.find((d) => d.id === dealId);
  const patch = fromPipelineGroup(group, current?.pipelineStage);
  try {
    const updated = await dealsRepository.update(dealId, patch);
    set({ deals: get().deals.map((d) => (d.id === dealId ? updated : d)) });
  } catch (err) {
    // surface to UI (toast / field error) instead of swallowing
    console.error("Failed to move deal", err);
    throw err;
  }
},
```

### WR-02: Add Deal submit failures leave the dialog stuck with no feedback

**File:** `src/features/pipeline/components/AddDealDialog.tsx:64-68`
**Issue:** `onSubmit` does `await addDeal(values); form.reset(...); onOpenChange(false);` with no `try/catch`. If `addDeal` (i.e., `dealsRepository.create`) ever rejects, the `reset`/`close` calls never run — the dialog stays open with the submit button in an indeterminate state, no error is shown to the user, and the thrown error becomes an unhandled rejection inside `form.handleSubmit`'s async wrapper (React does not await the DOM `onSubmit` handler's returned promise).
**Fix:**
```ts
const onSubmit = async (values: AddDealFormValues) => {
  try {
    await addDeal(values);
    form.reset(DEFAULT_VALUES);
    onOpenChange(false);
  } catch (err) {
    form.setError("root", { message: "Could not save this deal. Try again." });
  }
};
```

### WR-03: No double-submit guard — rapid double-click creates duplicate deals

**File:** `src/features/pipeline/components/AddDealDialog.tsx:176-178` (submit button) and `:64-68` (`onSubmit`)
**Issue:** The `Add Deal` submit button is never disabled while `form.formState.isSubmitting` is true. Because `onSubmit` is async and `addDeal` awaits a promise, a user who double-clicks (or double-presses Enter) before the first call resolves fires `addDeal` twice with the same form values, producing two near-identical `Deal` records (each with its own `crypto.randomUUID()`). The dialog only closes after the *first* call's promise resolves, so the second, now-orphaned call still completes and silently adds a duplicate deal to the board after the dialog is already closed.
**Fix:**
```tsx
<Button type="submit" disabled={form.formState.isSubmitting}>
  Add Deal
</Button>
```

### WR-04: `status` is tracked in the store but never consumed — no loading/error state anywhere

**File:** `src/features/pipeline/store/pipelineStore.ts:6-9,20-28`
**Issue:** `PipelineState.status` (`"idle" | "loading" | "ready"`) is set by `load()` but grep confirms no component (`PipelineBoard.tsx`, `App.tsx`) reads `usePipelineStore((s) => s.status)` anywhere. Two consequences: (1) while `load()` is in flight, `PipelineBoard` renders all 5 groups as empty ("0 deals", $0 totals) with no loading indicator, which will read as "the pipeline is empty" rather than "still loading" once this is backed by a real, non-instant API; (2) there is no `"error"` status value at all, so if `dealsRepository.list()` ever rejects, `load()` throws, `status` stays stuck at `"loading"` forever, and the board is permanently empty with no way for the user to know something failed.
**Fix:** Either consume `status` in `PipelineBoard` (skeleton/spinner while `"loading"`) or remove the field until it's used; and add an `"error"` status + `catch` in `load()` so a failed fetch is distinguishable from an empty pipeline.

### WR-05: `button.tsx` fails the project's own ESLint config (`react-refresh/only-export-components`)

**File:** `src/components/ui/button.tsx:66`
**Issue:** Running `npx eslint src` reports:
```
src/components/ui/button.tsx
  66:18  error  Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components  react-refresh/only-export-components
```
`buttonVariants` (a `cva` config, not a component) is exported alongside the `Button` component from the same file, which breaks the guarantee `eslint-plugin-react-refresh` is meant to enforce and would fail `npm run lint` (`package.json` script `"lint": "eslint ."`) for anyone actually running the configured gate against `src/`.
**Fix:** Move `buttonVariants` (and the `cva` call) into a sibling file, e.g. `src/components/ui/button-variants.ts`, and re-export/import it from `button.tsx` — the standard shadcn/ui fix for this exact warning.

## Info

### IN-01: Pipeline-group label metadata is defined three separate times

**File:** `src/features/pipeline/components/AddDealDialog.tsx:28-34`, `src/features/pipeline/components/StageSelect.tsx:12-18`, `src/features/pipeline/components/GroupSection.tsx:19-53`
**Issue:** The 5 `PipelineGroup` values and their display labels ("Prospect", "Lead", "Opportunity", "Deal / Won", "Lost") are hand-duplicated verbatim in `AddDealDialog`'s `GROUP_OPTIONS` and `StageSelect`'s `GROUP_OPTIONS` (both files' own comments acknowledge they're "the same 5 labeled stage options"), and overlap a third time with `GroupSection`'s `GROUP_META`. A label change (e.g. renaming "Deal / Won") requires editing 3 files in sync.
**Fix:** Extract one shared `shared/constants/pipeline-groups.ts` exporting `{ value, label, icon?, accent?, tint? }` metadata per group, and derive `GROUP_OPTIONS` from it in both `AddDealDialog` and `StageSelect`.

### IN-02: `currencyFormatter` duplicated identically in two files

**File:** `src/features/pipeline/components/DealTable.tsx:17-21`, `src/features/pipeline/components/GroupSection.tsx:7-11`
**Issue:** Both files construct an identical `new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })`.
**Fix:** Move to a shared `src/lib/format.ts` (`export const currencyFormatter = ...`) and import it from both call sites.

### IN-03: shadcn `ui/*` components bypass the project's declared `cn` alias

**File:** `src/components/ui/button.tsx:3`, `dialog.tsx:2`, `field.tsx:3`, `input.tsx:2`, `label.tsx:2`, `select.tsx:2`, `separator.tsx:4`
**Issue:** `components.json` declares `"utils": "@/lib/utils"` as the project's `cn` import point, and `src/lib/utils.ts` exists solely to re-export it. Every generated `ui/*` component instead imports `cn` directly from the `"cn"` npm package, bypassing that alias; only the hand-written `GroupSection.tsx` actually imports from `@/lib/utils`. This means `src/lib/utils.ts` is effectively dead/unused by the vendor components, and any future customization of `cn` (prefixing, custom merge config) applied only in `@/lib/utils` would silently not apply to any `ui/*` primitive.
**Fix:** Either regenerate the `ui/*` components to import from `@/lib/utils` (matching `components.json`'s own convention), or intentionally drop `src/lib/utils.ts` and standardize all call sites on the `"cn"` package directly.

### IN-04: Native HTML `min={0}` on the Value field bypasses the app's own zod/FieldError validation UX

**File:** `src/features/pipeline/components/AddDealDialog.tsx:113-121`
**Issue:** The Value `<Input type="number" min={0} ... />` has no `noValidate` on the surrounding `<form>` (`:83`). Entering a negative number triggers the browser's native constraint-validation UI (a native tooltip) and blocks the "submit" event from ever reaching `form.handleSubmit`, so the app's styled `FieldError` component (built specifically for this form) never renders for that case — only zod's `.positive()` message path (triggered by `0` or non-numeric input) goes through the app's own error UI. Validation feedback is inconsistent depending on which invalid value is entered.
**Fix:** Add `noValidate` to the `<form>` element (or drop the native `min={0}`) so all validation feedback consistently routes through zod + `FieldError`.

### IN-05: Value field shows a literal "0" instead of a blank field on open

**File:** `src/features/pipeline/components/AddDealDialog.tsx:36-43,113-121`
**Issue:** `DEFAULT_VALUES.value = 0`, and the input's `value={(field.value as string | number | undefined) ?? ""}` only substitutes `""` for `null`/`undefined` — `0` is neither, so it renders as the digit "0" every time the dialog opens, which the user must delete before typing a real value.
**Fix:** Use `value: undefined` (or `""`) in `DEFAULT_VALUES` for the `value` field's pre-coercion input shape, so the field renders blank; zod's `z.coerce.number()` will still reject an empty submission with "Value must be positive".

---

_Reviewed: 2026-09-07T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
