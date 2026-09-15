# Phase 2: Deal Detail & Line Items - Research

**Researched:** 2026-09-07
**Domain:** React frontend CRM — side-drawer detail view, inline-editable table cells, dynamic line-item sub-forms, derived-value rollup with manual override
**Confidence:** MEDIUM-HIGH (stack/library APIs are well-documented and cross-checked; the exact rollup-override interaction is a project-specific design synthesis, not a library feature, so it's flagged LOW/ASSUMED where relevant)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** The deal detail view is a side drawer/panel (slides in from the side), not a modal dialog and not a separate full page/route. The pipeline board stays visible behind it. Matches project research's explicit recommendation over a separate page for a prototype.
- **D-02:** Clicking anywhere on a deal's row in the pipeline table opens its detail drawer — no separate "view" icon/button. Must not conflict with the row's existing Stage Select click target (Phase 1); the Stage Select's own click area should stop propagation so it doesn't also trigger the drawer.
- **D-03:** The detail drawer stays open after an edit — it does not auto-close the way Phase 1's Add Deal modal closes on submit. A user can make several field edits and line-item changes in one visit before explicitly closing it.

### Claude's Discretion

The user chose to discuss only "Detail view layout & trigger" this round. The following gray areas were presented but not discussed — Claude/researcher/planner have discretion, informed by the research already on file:

- **Inline core-field editing UX (in the pipeline table)** — no constraint given on the exact trigger mechanism (click-to-edit vs. dedicated edit icon) or save behavior. Default to click-to-edit-in-place (click the cell, it becomes an input, save on blur/Enter, Escape cancels) — the lowest-friction, most conventional pattern, consistent with the "no full spreadsheet-grade editing" scope boundary in REQUIREMENTS.md's Out of Scope list.

- **Line-item add/edit/remove UX (inside the drawer)** — no constraint given on the exact interaction mechanism. PITFALLS.md Pitfall 2 already locks the data shape (`Deal.lineItems: LineItem[]`, one level only, no self-referential nesting, id-based addressing — not a gray area, already decided). What remains open is purely the UI mechanism: default to an inline-editable mini-table (reusing the same headless-table + inline-cell-edit pattern as the pipeline table) with an "Add Line Item" button appending a new editable row and a per-row remove control. Each line item's `id` must be assigned the same way deals are (`crypto.randomUUID()`), never an array index.

- **Value override behavior (auto-sum vs. manual)** — research explicitly flags this as needing an explicit decision, and the user chose not to discuss it this round — so this is a genuine judgment call being made without user sign-off, not a settled decision. Researcher/planner should feel free to revisit this with the user at plan time if it doesn't sit right. Claude's working approach, absent further input: the Value field stays directly editable at all times; typing a different number into it counts as a manual override. While the current value still equals the computed line-item sum (i.e., never been manually overridden, or a prior override happens to match), the value keeps auto-tracking the sum as line items change. Once the value diverges from the computed sum (a real manual override), line-item edits stop silently overwriting it — instead, show a small "Reset to sum ($X)" affordance next to the Value field whenever it differs from the computed sum, letting the user snap back explicitly.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope. No scope-creep suggestions came up.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DEAL-02 | User can edit a deal's fields inline (name, value, owner, close date) | See "Pattern 2: Click-to-Edit Inline Cell" and "Code Examples" — id-based `updateDeal` patch, `EditableCell` component, propagation guard vs. row-click |
| DEAL-03 | User can open a deal detail drawer/panel to view and edit its full details | See "Pattern 1: shadcn Sheet Side Drawer" — `npx shadcn@latest add sheet`, `side="right"`, controlled open state owned by `PipelineBoard`/`DealTable`, no auto-close on submit |
| DEAL-04 | User can add, edit, and remove line items on a deal | See "Pattern 3: useFieldArray for Line Items" and "LineItem data model" — `LineItem` type, zod schema, id-based `append`/`remove` |
| DEAL-05 | A deal's total value defaults to the sum of its line items, with the option to manually override it | See "Pattern 4: Computed-Until-Touched Rollup" — pure selector `sumLineItems()`, divergence check against `deal.value`, "Reset to sum" affordance |
</phase_requirements>

## Summary

This phase extends Phase 1's shipped `Deal`/`DealsRepository`/`usePipelineStore`/`DealTable` code rather than introducing new architectural layers. Three genuinely new pieces of UI are needed: (1) a shadcn **Sheet** side-drawer (not yet generated in this project — `npx shadcn@latest add sheet`), opened by a row click on `DealTable` and showing a deal's full fields plus its line items; (2) **click-to-edit inline cells** on the existing `/legacy`-subpath TanStack table for the four core fields (name, value, owner, closeDate), which must not fire when the user is actually trying to click into an editable cell or the existing `StageSelect`; and (3) a **line-items mini-table inside the drawer**, driven by `react-hook-form`'s `useFieldArray`, whose per-row `unitPrice × units` subtotal and deal-level total are **always computed, never stored** (per PITFALLS.md Pitfall 4/5, verified against this project's own `Deal` type which currently stores no derived fields at all).

The single genuinely novel design problem is DEAL-05's "computed-until-touched" rollup: the deal's `value` field must auto-track the line-item sum until the user manually overrides it, at which point it should stop being silently clobbered. The cleanest implementation needs **no new boolean field on `Deal`** — comparing `deal.value` against a freshly computed `sumLineItems(deal.lineItems)` (rounded to avoid float-precision false positives) is sufficient to detect divergence and drive both the auto-tracking behavior and the "Reset to sum" affordance. This keeps `Deal`'s shape stable and avoids a `hasManualOverride` field that could itself drift out of sync with reality.

**Primary recommendation:** Generate the shadcn `sheet` component, widen `DealsRepository.update()`'s patch type and `usePipelineStore`'s `updateDeal` action to cover `name`/`value`/`owner`/`closeDate`/`lineItems`, add a `LineItem` type + `sumLineItems()` pure selector to `shared/`, and build the drawer's edit surfaces (core fields + line items) as **field-level auto-committing forms** (each field/row commits to the store on blur, not one page-level Save button) so D-03's "stays open, multiple edits in one visit" requirement falls out naturally rather than needing special-cased submit logic.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Detail drawer rendering (Sheet) | Browser / Client | — | Pure presentational React component (`DealDetailDrawer`), no server involvement in this frontend-only prototype |
| Inline core-field edit (pipeline table) | Browser / Client | Database / Storage | Edit UI + validation live client-side; the committed value is persisted via the mock repository (stand-in for a future API tier) |
| Line-item CRUD | Browser / Client | Database / Storage | Same split as above — `useFieldArray` manages transient form state client-side, `updateDeal` persists the committed `lineItems` array through the repository seam |
| Value rollup computation (sum of line items) | Browser / Client | — | Pure derived value computed at render/selector time (`sumLineItems`) — never persisted as its own field, so there is no "storage tier" for it at all (this is the point of PITFALLS.md Pitfall 4/5) |
| Manual-override detection ("has the value diverged from the sum") | Browser / Client | — | A comparison, not stored state — computed each render from `deal.value` vs. `sumLineItems(deal.lineItems)` |
| Data persistence (deal patch, line items) | Database / Storage | Browser / Client | `MockDealsRepository` (in-memory, stands in for the future real API/DB) is the sole write target; components never mutate `Deal` objects directly |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@tanstack/react-table` | 9.2.3 `[VERIFIED: package.json]` | Line-items mini-table + continued pipeline-table inline editing | Already the project's table engine (Phase 1); this phase reuses its `/legacy` compat subpath (`useLegacyTable`, `legacyCreateColumnHelper`, `getCoreRowModel`) for consistency — confirmed still required by reading `src/features/pipeline/components/DealTable.tsx:11` this session, which imports exactly those three names from `@tanstack/react-table/legacy` |
| `react-hook-form` | 7.86.0 `[VERIFIED: package.json]` | Line-items array form state (`useFieldArray`) + per-field validation for inline edits | Already the project's form library (Phase 1's `AddDealDialog`); `useFieldArray` is its purpose-built API for exactly this "dynamic array of rows" shape |
| `zod` | 4.4.3 `[VERIFIED: package.json]` | `LineItem` schema + widened deal-edit schema | Already the project's schema/validation library; one schema per entity per CLAUDE.md convention |
| `@hookform/resolvers` | 5.9.1 `[VERIFIED: package.json]` | `zodResolver` bridge, same as Phase 1 | Already installed; no new dependency |
| `radix-ui` (unified package) | 1.6.7 `[VERIFIED: package.json]` | Underlying primitive for the new shadcn `sheet.tsx` | Already installed and already the primitive `dialog.tsx` is built on — confirmed by reading `src/components/ui/dialog.tsx:3`, `import { Dialog as DialogPrimitive } from "radix-ui"` — shadcn's `sheet.tsx` generator produces the same `Dialog as SheetPrimitive` import pattern, so **no new npm package is required** for the drawer |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lucide-react` | 1.41.0 `[VERIFIED: package.json]` | Icons for the drawer close button, add/remove line-item buttons, "Reset to sum" icon | Already installed; reuse, don't add a second icon set |
| `date-fns` | 4.4.0 `[VERIFIED: package.json]` | Close-date formatting/parsing inside the drawer's editable date field | Already used identically in `DealTable.tsx` (`format`/`parseISO`) |
| `class-variance-authority`, `clsx`/`cn` | installed `[VERIFIED: package.json]` | Styling the drawer, editable-cell states (editing vs. display), and the divergence-affordance badge | Already the project's className composition pattern |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| shadcn `Sheet` (Radix Dialog under the hood) | A hand-rolled `position: fixed` panel with manual focus-trap | Sheet gets focus trap, Escape-to-close, and overlay/backdrop handling for free via Radix; hand-rolling reintroduces exactly the a11y bugs component libraries exist to prevent — no reason to avoid it here |
| `react-hook-form`'s `useFieldArray` for line items | Plain `useState<LineItem[]>` array with manual `.map`/`.filter` | `useFieldArray` gives stable per-row keys (`fields[i].id`), integrates zod validation per-index automatically, and is already the project's form library — a hand-rolled array reducer would duplicate that machinery for no benefit |
| Field-level auto-commit (this research's recommendation) | One page-level `<form onSubmit>` with a single "Save" button in the drawer | A single Save button conflicts with D-03's framing ("several field edits... in one visit... explicitly closing it") and with DEAL-02's requirement that inline table edits commit individually; auto-commit-per-field is more consistent with both requirements and avoids a large dirty-form state machine |

**Installation:**
```bash
npx shadcn@latest add sheet
```
No `npm install` of a new package is required — the shadcn CLI only writes `src/components/ui/sheet.tsx`, sourcing from the already-installed `radix-ui` package (verified above).

**Version verification:** All libraries this phase touches are already pinned and installed (confirmed by reading `package.json` directly this session — see `[VERIFIED: package.json]` tags above). No new registry lookups were needed since no new npm dependency is introduced.

## Package Legitimacy Audit

**No new npm packages are introduced by this phase.** The only new artifact is `src/components/ui/sheet.tsx`, generated by the already-installed `shadcn` CLI (`^4.21.0`, confirmed in `package.json` `dependencies`) from the already-installed `radix-ui` unified package. The Package Legitimacy Gate does not apply — there is nothing to check against the npm registry that isn't already vetted and running in this codebase.

**Packages removed due to [SLOP] verdict:** none (n/a — no new packages)
**Packages flagged as suspicious [SUS]:** none (n/a — no new packages)

## Architecture Patterns

### System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              DealTable (row)                             │
│                                                                            │
│   row onClick ──────────────► opens DealDetailDrawer(dealId)             │
│      │                                                                    │
│      ├─ EditableCell (name/value/owner/closeDate)                       │
│      │     click ─(stopPropagation)─► becomes <input>                   │
│      │     blur/Enter ─► updateDeal(id, { field: value })               │
│      │     Escape ─► revert, no store call                              │
│      │                                                                    │
│      └─ StageSelect                                                     │
│            click ─(stopPropagation)─► existing moveStage(id, group)     │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         DealDetailDrawer (Sheet)                         │
│                                                                            │
│  Core fields (name/value/owner/closeDate) — same EditableCell/field      │
│  pattern as the table, field-level commit on blur                       │
│                                                                            │
│  LineItemsTable (useFieldArray: fields, append, remove)                 │
│    ├─ per-row cells (product/service, sku, units, unitPrice, type)      │
│    │     onBlur/onChange ─► updateDeal(id, { lineItems: nextArray })    │
│    ├─ per-row subtotal = units × unitPrice   (computed, never stored)   │
│    ├─ "Add Line Item" ─► append({ id: crypto.randomUUID(), ... })       │
│    └─ per-row remove ─► remove(index) ─► updateDeal(...)                │
│                                                                            │
│  Value field:                                                            │
│    computed = sumLineItems(deal.lineItems)                              │
│    diverged = round2(deal.value) !== round2(computed)                   │
│    diverged ? show "Reset to sum ($computed)" : keep auto-tracking      │
└──────────────────────────────────────────────────────────────────────────┘
                                    │  updateDeal(id, patch)
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  usePipelineStore.updateDeal  ──►  dealsRepository.update(id, patch)    │
│  (await, then replace deal by id in store.deals — never by index)       │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                    MockDealsRepository (in-memory, id-based)
```

### Recommended Project Structure

```
src/
├── shared/
│   ├── types/
│   │   └── deal.ts                       # + LineItem, LineItemType; Deal.lineItems: LineItem[]
│   └── utils/
│       └── line-items.ts                 # NEW: sumLineItems(lineItems), computeSubtotal(item)
├── data/
│   ├── deals-repository.ts               # widen update()'s patch type
│   └── mock/mock-deals-repository.ts     # no structural change — already id-based, spread-merges patch
├── features/pipeline/
│   ├── store/pipelineStore.ts            # + updateDeal(id, patch) action
│   └── components/
│       ├── DealTable.tsx                 # + row onClick opens drawer; core-field columns become EditableCell
│       ├── EditableCell.tsx              # NEW: click-to-edit-in-place, local state, commit-on-blur/Enter
│       ├── DealDetailDrawer.tsx          # NEW: shadcn Sheet, owns open/close + selected dealId
│       ├── LineItemsTable.tsx            # NEW: useFieldArray-backed mini-table, add/remove rows
│       └── deal-edit-schema.ts           # NEW: zod schema for core-field edits + LineItem schema
└── components/ui/
    └── sheet.tsx                         # NEW: `npx shadcn@latest add sheet`
```

### Pattern 1: shadcn Sheet Side Drawer

**What:** A Radix-Dialog-based slide-in panel. `SheetContent` accepts a `side` prop (`top | right | bottom | left`, default `right`) controlling which edge it slides in from.
**When to use:** D-01's explicit requirement — side drawer, not modal, not a route.
**Example:**
```tsx
// Source: shadcn/ui official docs pattern (ui.shadcn.com/docs/components/sheet), cross-checked [CITED: ui.shadcn.com]
<Sheet open={open} onOpenChange={onOpenChange}>
  <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
    <SheetHeader>
      <SheetTitle>{deal.name}</SheetTitle>
    </SheetHeader>
    {/* core fields + LineItemsTable */}
  </SheetContent>
</Sheet>
```
Follow `AddDealDialog.tsx`'s existing fully-controlled pattern (`{ open, onOpenChange }` props, no internal trigger) — `DealTable`'s row click sets `selectedDealId` in a parent-owned `useState`, exactly how `PipelineBoard` currently owns the Add Deal dialog's open state (`01-04-SUMMARY.md` key-decision: "PipelineBoard owns the Add Deal button and its open/close useState... AddDealDialog stays a fully controlled component with no internal DialogTrigger"). `DealDetailDrawer` should follow the identical ownership shape, with `DealTable` or `PipelineBoard` owning `selectedDealId: string | null`.

**D-03 implication:** Because the Sheet's `open`/`onOpenChange` is fully decoupled from any form submission, there is no auto-close behavior to suppress — simply never call `onOpenChange(false)` from a field-commit handler (only from the Sheet's own close button/overlay/Escape). This is the opposite of `AddDealDialog.onSubmit`, which explicitly calls `onOpenChange(false)` after `addDeal()` — do not copy that line into the drawer's field handlers.

### Pattern 2: Click-to-Edit Inline Cell (Pipeline Table)

**What:** A `columnHelper.accessor()` cell renderer that toggles between display text and an `<input>` based on local `isEditing` state, committing via TanStack's `meta.updateData` convention adapted to be **id-based**.
**When to use:** DEAL-02's four inline-editable fields on `DealTable`.
**Why id-based, not index-based `meta.updateData`:** The library's documented pattern is `updateData(rowIndex, columnId, value)` `[CITED: tanstack.com/table docs, module-augmented TableMeta]`, but `PITFALLS.md` Pitfall 5 (verified against this project's own code — `mock-deals-repository.ts:49`, `// Find by stable id, never by array index`) prohibits index-based lookups since each `GroupSection` renders a filtered/grouped slice, not the full `deals` array — a `rowIndex` inside one group's table has no relationship to the deal's position in the store's flat array. Pass the deal's `id` through `meta` instead of relying on `rowIndex`.

**Example:**
```tsx
// Source: pattern synthesis — TanStack editable-cell convention [CITED: tanstack.com/table]
// adapted to id-based lookup per PITFALLS.md Pitfall 5 [VERIFIED: src/data/mock/mock-deals-repository.ts:49]
// "// Find by stable id, never by array index (research/PITFALLS.md Pitfall 5)"
function EditableCell({ dealId, columnId, value, onCommit }: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  if (!isEditing) {
    return (
      <span
        className="block cursor-text px-1 py-0.5"
        onClick={(e) => {
          e.stopPropagation(); // D-02: must not also open the drawer
          setIsEditing(true);
        }}
      >
        {value}
      </span>
    );
  }

  const commit = () => {
    setIsEditing(false);
    if (draft !== String(value)) onCommit(dealId, columnId, draft);
  };

  return (
    <input
      autoFocus
      className="w-full px-1 py-0.5"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") { setDraft(String(value)); setIsEditing(false); }
      }}
      onClick={(e) => e.stopPropagation()}
    />
  );
}
```
The row's own `onClick={() => openDrawer(deal.id)}` must be added to `<tr>` in `DealTable.tsx`; every interactive cell (`EditableCell`'s span/input, and the existing `StageSelect`'s `SelectTrigger`) must independently `stopPropagation` — Radix's `SelectTrigger` does **not** stop propagation by default, so `StageSelect.tsx`'s render needs a wrapping `onClick={(e) => e.stopPropagation()}` added this phase (it currently has no click guard at all, confirmed by reading `StageSelect.tsx` this session — no `stopPropagation`/`onClick` wrapper exists on the `Select`/`SelectTrigger`).

### Pattern 3: `useFieldArray` for Line Items

**What:** `react-hook-form`'s array-management hook: `const { fields, append, remove } = useFieldArray({ control, name: "lineItems" })`.
**When to use:** DEAL-04's add/edit/remove line items inside the drawer.
**Key correctness rule:** Render rows keyed by `fields[i].id` (RHF's internally generated stable key), never the array index `[CITED: react-hook-form.com useFieldArray docs]` — matches this project's existing "never array index" rule already enforced for `Deal`/line items per `PITFALLS.md` Pitfall 5 and `02-CONTEXT.md`'s explicit instruction ("Each line item's `id` must be assigned the same way deals are (`crypto.randomUUID()`), never an array index").

**Example:**
```tsx
// Source: react-hook-form official useFieldArray pattern [CITED: react-hook-form.com/docs/usefieldarray]
const form = useForm<LineItemsFormInput, unknown, LineItemsFormValues>({
  resolver: zodResolver(lineItemsSchema),
  defaultValues: { lineItems: deal.lineItems },
});
const { fields, append, remove } = useFieldArray({ control: form.control, name: "lineItems" });

// Add:
append({ id: crypto.randomUUID(), productOrService: "", sku: "", units: 1, unitPrice: 0, type: "product" });

// Render:
{fields.map((field, index) => (
  <tr key={field.id}>
    <Controller name={`lineItems.${index}.productOrService`} control={form.control} render={...} />
    {/* ...sku, units, unitPrice, type... */}
    <td>{currencyFormatter.format(units * unitPrice)}</td> {/* subtotal — computed, not a form field */}
    <button onClick={() => remove(index)}>Remove</button>
  </tr>
))}
```
**z.coerce.number() gotcha carries forward:** `units` and `unitPrice` need `z.coerce.number()` for numeric `<input>` handling, which — per `01-04-SUMMARY.md`'s already-encountered, already-solved deviation — breaks a single-generic `useForm<T>` against `zodResolver`. Reuse the exact fix already shipped in `add-deal-schema.ts`: export both `LineItemFormValues = z.infer<typeof lineItemSchema>` (post-coercion output) and `LineItemFormInput = z.input<typeof lineItemSchema>` (pre-coercion input), and use the 3-generic `useForm<FormInput, unknown, FormValues>(...)` form — this is not a new discovery, it is a known, already-fixed-once pitfall in this exact codebase.

### Pattern 4: Computed-Until-Touched Rollup (DEAL-05)

**What:** Rather than storing a `hasManualOverride: boolean` field on `Deal` (a second piece of state that could itself drift out of sync — exactly the anti-pattern PITFALLS.md Pitfall 1/4 warns against for *any* derived value), detect divergence by comparing the currently stored `deal.value` against a freshly computed `sumLineItems(deal.lineItems)`.
**When to use:** DEAL-05, and specifically the CONTEXT.md Claude's Discretion item on value-override behavior.
**Trade-off flagged (LOW confidence — genuine judgment call, not verified against a locked user decision):** This comparison-based approach avoids a new field, but has one edge case: if a user's manual override happens to numerically equal the current line-item sum, the system cannot distinguish "never overridden" from "overridden to the same number" — it will (correctly, per the "computed-until-touched" semantics `[ASSUMED — synthesized from web pattern research, not tied to an authoritative source]`) resume auto-tracking on the next line-item edit. This is called out in `02-CONTEXT.md` itself as an explicit open question for the user to weigh in on before/during planning — the planner should treat this as unconfirmed and consider surfacing it back to the user rather than silently locking it in.

**Example:**
```typescript
// shared/utils/line-items.ts — NEW this phase
// Source: pattern synthesis from "computed until touched" web research [CITED: general React derived-state pattern, cross-checked multiple sources]
export function computeSubtotal(item: Pick<LineItem, "units" | "unitPrice">): number {
  return item.units * item.unitPrice;
}

export function sumLineItems(lineItems: LineItem[]): number {
  return lineItems.reduce((sum, item) => sum + computeSubtotal(item), 0);
}

// Round to cents before comparing — avoids float-precision false positives
// (e.g., 0.1 + 0.2 !== 0.3) incorrectly flagging "manual override" when none occurred.
const round2 = (n: number) => Math.round(n * 100) / 100;

export function hasManualOverride(deal: Pick<Deal, "value" | "lineItems">): boolean {
  if (deal.lineItems.length === 0) return false; // nothing to diverge from
  return round2(deal.value) !== round2(sumLineItems(deal.lineItems));
}
```
```tsx
// DealDetailDrawer.tsx — value field UI
const computed = sumLineItems(deal.lineItems);
const overridden = hasManualOverride(deal);
// value input always editable (typing a new number is itself the override signal)
// when a line item changes and !overridden, auto-set value = computed
// when overridden, show: <button onClick={() => updateDeal(deal.id, { value: computed })}>Reset to sum ({currencyFormatter.format(computed)})</button>
```

### Anti-Patterns to Avoid

- **Storing `subtotal` on `LineItem` or a `total`/`computedValue` field on `Deal`:** Verified against this project's own `Deal` type (`src/shared/types/deal.ts:23-37`, quoted in full below) — it currently stores zero derived fields (`pipelineStage`/`outcome` are source fields, `PipelineGroup` is explicitly documented as "never stored directly on Deal"). Adding a stored `subtotal` or `total` this phase would be the project's first violation of its own established pattern. Compute both at render/selector time via `computeSubtotal`/`sumLineItems`.
- **A `hasManualOverride` boolean field:** Tempting, but per Pattern 4 above, unnecessary — the comparison-based approach is simpler and cannot itself drift out of sync (there is nothing to keep in sync).
- **Single page-level "Save" button for the whole drawer:** Conflicts with D-03's "stays open... several edits... explicitly closing it" framing; use field-level auto-commit instead (see Pattern 2, applied to the drawer's core fields too, not only the table).
- **Reusing `AddDealDialog`'s `onOpenChange(false)`-on-submit pattern in the drawer:** That line is specific to Phase 1's D-04 ("no batch-add/keep-open mode"); copying it into any drawer field handler directly violates this phase's D-03.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Side-drawer overlay, focus trap, Escape-to-close | A custom `position: fixed` panel + manual `document.addEventListener("keydown", ...)` | shadcn `Sheet` (`npx shadcn@latest add sheet`) | Radix's `Dialog` primitive underneath already solves focus trap, ARIA roles, and outside-click/Escape dismissal — hand-rolling reintroduces a11y bugs for zero benefit, and this project already has the exact same primitive wired for `dialog.tsx` |
| Dynamic array of form rows (line items) | A `useState<LineItem[]>` array with manual index-based `.map`/splice mutations | `react-hook-form`'s `useFieldArray` | Provides stable per-row keys, integrates zod validation per index, and is the project's existing form library — a hand-rolled array reducer duplicates this for no gain and risks reintroducing the exact index-based bugs PITFALLS.md Pitfall 5 warns about |
| Detecting "has this value been manually changed" | A dirty/touched boolean threaded through props/store | Direct comparison of stored value vs. freshly computed value (Pattern 4) | Avoids a second piece of state that must itself be kept correct; the comparison is always correct by construction |

**Key insight:** Every "don't hand-roll" item in this phase already has a working reference implementation somewhere in this exact codebase from Phase 1 (`AddDealDialog`'s Dialog+RHF+zod pattern, `mock-deals-repository.ts`'s id-based update). The highest-value research output isn't a new library recommendation — it's confirming which Phase 1 pattern to copy for each new UI surface, and where the *existing* code (repository's patch type, `StageSelect`'s missing propagation guard) needs to change to support this phase.

## Common Pitfalls

### Pitfall 1: `DealsRepository.update()`'s patch type is too narrow for this phase

**What goes wrong:** The current interface only accepts `Partial<Pick<Deal, "pipelineStage" | "outcome" | "lostReason">>` — verified by reading `src/data/deals-repository.ts:14-17` this session:
```typescript
update(
  id: string,
  patch: Partial<Pick<Deal, "pipelineStage" | "outcome" | "lostReason">>,
): Promise<Deal>;
```
Calling `dealsRepository.update(id, { value: 500 })` or `{ lineItems: [...] }` will fail to type-check as-is.
**Why it happens:** Phase 1 only needed to patch stage-transition fields; this phase's inline edits and line-item CRUD need to patch `name`, `value`, `owner`, `closeDate`, and `lineItems` too.
**How to avoid:** Widen the `Pick<...>` union in `deals-repository.ts` (and the identical-shaped `update()` implementation in `mock-deals-repository.ts`, which already does a generic `{ ...this.deals[index], ...patch }` spread-merge — verified at `mock-deals-repository.ts:53`, so the implementation needs **no logic change**, only the type signature needs widening) to include every field this phase's actions can patch.
**Warning signs:** `tsc` errors on `updateDeal`'s repository call the moment it's written against the current interface.

### Pitfall 2: `StageSelect` has no click-propagation guard today

**What goes wrong:** Adding a row-level `onClick` to open the drawer (D-02) will also fire when a user clicks `StageSelect`'s trigger, opening the drawer every time someone tries to move a deal's stage.
**Why it happens:** `StageSelect.tsx` (read in full this session) has no `stopPropagation` anywhere — Phase 1 never needed one, since nothing on the row previously listened for clicks.
**How to avoid:** Wrap `StageSelect`'s rendered `<Select>` (or its `SelectTrigger`) in an element with `onClick={(e) => e.stopPropagation()}` as part of this phase's work — this is an explicit CONTEXT.md instruction ("the Stage Select's own click area should stop propagation"), not optional polish.
**Warning signs:** Clicking the stage dropdown also opens the drawer in manual testing.

### Pitfall 3: Float-precision false positives on the "has been overridden" check

**What goes wrong:** Comparing `deal.value !== sumLineItems(deal.lineItems)` directly (no rounding) will occasionally report a manual override that never happened, purely from floating-point arithmetic (e.g., three line items whose unit prices sum to `100.00000000000001`).
**Why it happens:** JavaScript's IEEE-754 floats don't represent most decimal currency values exactly.
**How to avoid:** Round both sides to cents (`Math.round(n * 100) / 100`) before comparing, as shown in Pattern 4's `hasManualOverride`.
**Warning signs:** The "Reset to sum" affordance appears even immediately after adding a fresh, untouched line item.

### Pitfall 4: Re-encountering the already-solved `z.coerce.number()` / `zodResolver` typing mismatch

**What goes wrong:** Writing `useForm<LineItemFormValues>({ resolver: zodResolver(lineItemSchema) })` (single generic) will fail exactly the same way `AddDealDialog`'s first draft did in Phase 1, if `units`/`unitPrice` use `z.coerce.number()`.
**Why it happens:** `z.coerce.number()` makes the schema's pre-parse input type diverge from its `z.infer` output type; this is now a known, previously-hit issue in this exact codebase, verified via `01-04-SUMMARY.md`'s documented Rule-1 deviation.
**How to avoid:** Apply the same fix already shipped in `add-deal-schema.ts` — export both `z.input<...>` and `z.infer<...>` types and use react-hook-form's 3-generic `useForm<Input, unknown, Values>(...)` form from the start, rather than rediscovering the fix.
**Warning signs:** `TS2322`/`TS2345` errors on the `resolver` option, identical to the ones documented in `01-04-SUMMARY.md`.

### Pitfall 5: Unhandled repository-rejection / no double-submit guard (carried forward from Phase 1)

**What goes wrong:** `updateDeal` (this phase's new action) can fail the same way Phase 1's `moveStage`/`addDeal` already do — no `.catch()`/try-catch around the repository call, and no guard against a field being committed twice in quick succession (e.g., blur-then-Enter firing two commits).
**Why it happens:** Documented, non-blocking, but still-open finding from `01-REVIEW.md`, explicitly flagged in `02-CONTEXT.md`'s Integration Points section as "worth applying the same fix pattern to this phase's new `updateDeal`/line-item store actions from the start rather than repeating the gap."
**How to avoid:** Wrap `updateDeal`'s repository call in error handling (even a minimal `try { ... } catch { /* revert or surface error */ }`), and guard `EditableCell`'s commit handler against firing twice for the same value (the `draft !== String(value)` check in Pattern 2's example already partially addresses double-commit-of-unchanged-value, but a genuine double-submit-of-a-real-change under repository latency is still open).
**Warning signs:** A component test or manual click-through triggers two `updateDeal` calls for one logical edit.

## Code Examples

### Widened `Deal` type additions (new this phase)

```typescript
// shared/types/deal.ts — additions
// Existing Deal fields verified via Read this session, src/shared/types/deal.ts:23-37:
// export interface Deal {
//   id: string; name: string; company: string; value: number; owner: string;
//   closeDate: string; pipelineStage: PipelineStage; outcome: DealOutcome;
//   lostReason?: string; createdAt: string;
// }

export type LineItemType = "product" | "service";

export interface LineItem {
  id: string;
  productOrService: string;
  sku: string;
  units: number;
  unitPrice: number;
  type: LineItemType;
  // subtotal is intentionally NOT a field — always computeSubtotal(item) at render time
}

export interface Deal {
  // ...existing fields unchanged...
  lineItems: LineItem[];
}
```

### Widened repository patch type

```typescript
// data/deals-repository.ts — widen this phase
export interface DealsRepository {
  list(): Promise<Deal[]>;
  create(input: NewDealInput): Promise<Deal>;
  update(
    id: string,
    patch: Partial<
      Pick<Deal, "pipelineStage" | "outcome" | "lostReason" | "name" | "value" | "owner" | "closeDate" | "lineItems">
    >,
  ): Promise<Deal>;
}
```
`MockDealsRepository.update()`'s implementation (`{ ...this.deals[index], ...patch }`, `mock-deals-repository.ts:53`) needs no change — it already spread-merges an arbitrary patch object.

### `usePipelineStore` new action

```typescript
// features/pipeline/store/pipelineStore.ts — add alongside existing moveStage
updateDeal: async (id, patch) => {
  const updated = await dealsRepository.update(id, patch);
  set({ deals: get().deals.map((d) => (d.id === id ? updated : d)) });
},
```
Follows the exact shape of the existing `moveStage` action (verified this session, `pipelineStore.ts:35-41`) — await the repository, replace by id.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| TanStack Table v8 `useReactTable`/`createColumnHelper` (what Phase 1's original research assumed) | `/legacy` compat subpath (`useLegacyTable`, `legacyCreateColumnHelper`) | Discovered during Phase 1 execution (v9.2.3 is the installed/pinned version) | This phase's new line-items table and inline-edit columns must use the same `/legacy` subpath for consistency — confirmed still in force by reading `DealTable.tsx` this session |

**Deprecated/outdated:** None newly identified this phase — the codebase's existing `/legacy` decision from Phase 1 remains the correct path for any new TanStack Table code.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | "Computed-until-touched" comparison-based override detection (no `hasManualOverride` field) is the right implementation for DEAL-05, rather than an explicit boolean flag | Pattern 4 | If the user actually wants an explicit persisted "this was manually set" flag (e.g., to distinguish "override happens to equal sum" from "never overridden"), this approach silently treats them the same — low functional risk for a prototype, but worth confirming with the user per CONTEXT.md's own flag on this exact question |
| A2 | Field-level auto-commit (not a single page-level Save button) is the right interaction model for the drawer's core fields | Architecture Patterns intro, Anti-Patterns | If the user expects an explicit "Save" action with a visible pending/dirty state, auto-commit-on-blur may feel too implicit; low risk since it is consistent with D-03's framing, but not a locked decision |
| A3 | `LineItem.type` is a two-value `"product" \| "service"` enum (matching CONTEXT.md's literal field list "product/service, SKU, units, unit price, subtotal, type") | Code Examples (`LineItem` type) | If "type" was meant to mean something else (e.g., a SKU category), the enum values would need to change — low risk, the CONTEXT.md wording strongly implies this reading |
| A4 | shadcn's generated `sheet.tsx` requires no new npm package beyond the already-installed `radix-ui` unified package | Standard Stack, Installation | If the shadcn CLI's current `sheet` registry entry has since started importing a different/additional Radix subpackage not covered by the unified `radix-ui` package, `npx shadcn add sheet` would surface a missing-peer error immediately at generation time — self-correcting, low risk |

## Open Questions (RESOLVED)

1. **Should DEAL-05's override state survive being reset to exactly the computed sum, or does it always re-arm auto-tracking the moment the numbers match?**
   - What we know: CONTEXT.md's Claude's Discretion section explicitly flags this as unresolved and invites revisiting with the user at plan time.
   - What's unclear: Whether a user who manually types a value that happens to equal the current sum should be treated as "still overridden" (a persisted flag) or "back to auto-tracking" (the comparison-only approach this research recommends).
   - Recommendation: Ship the comparison-only approach (Pattern 4) for its simplicity and consistency with the "never store a derived/redundant value" project convention; flag it explicitly to the user during `/gsd-plan-phase` or at UAT, per CONTEXT.md's own instruction.
   - **RESOLVED:** Locked as the comparison-only approach (no `hasManualOverride` field) — recorded in `02-UI-SPEC.md`'s "Assumptions Made" item 5 as "treated as locked for this UI-SPEC's purposes," and implemented as such in `02-02-PLAN.md`. Still the phase's lowest-confidence design call; revisit at UAT if it doesn't sit right.

2. **Does the drawer also need a visible "editing this field" affordance (e.g., a pencil icon) or is bare click-to-edit sufficient, matching the table?**
   - What we know: CONTEXT.md defers this to Claude's discretion with a stated default (click-to-edit-in-place, no dedicated icon).
   - What's unclear: Whether reviewers will find bare click-to-edit discoverable enough inside a drawer (as opposed to a table, where hovering over a grid of cells is a more familiar affordance).
   - Recommendation: Ship click-to-edit-in-place for consistency between table and drawer (one interaction pattern to learn, not two); revisit only if UAT flags discoverability as a problem.
   - **RESOLVED:** Shipped as bare click-to-edit-in-place, no pencil icon — consistent with Pattern 2 and used by both `02-01-PLAN.md` and `02-02-PLAN.md`. Revisit only if UAT flags discoverability.

## Environment Availability

Skipped — this phase introduces no new external tool, service, runtime, or CLI dependency beyond what Phase 1 already established (Node/npm/Vite, all already verified working in this repo). The one "new" artifact (`sheet.tsx`) is generated by the already-installed `shadcn` CLI against the already-installed `radix-ui` package.

## Validation Architecture

Skipped — `.planning/config.json`'s `workflow.nyquist_validation` is explicitly `false`.

## Security Domain

`security_enforcement` is `true` in `.planning/config.json` (absent would also mean enabled) with `security_asvs_level: 1`. This phase remains frontend-only, single-user, no-auth, mock-data-only per PROJECT.md's locked constraints — most ASVS categories are structurally not applicable.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | No | Explicitly out of scope this milestone (PROJECT.md) |
| V3 Session Management | No | No sessions exist in a frontend-only, no-auth prototype |
| V4 Access Control | No | Single-user, no roles/permissions this milestone |
| V5 Input Validation | Yes | zod schemas for the widened deal-edit fields and the new `LineItem` schema — every user-entered value (name, value, owner, closeDate, line-item fields) is validated before being committed to the store, exactly as Phase 1's `addDealSchema` already does |
| V6 Cryptography | No | No secrets/tokens/encryption surface in this phase |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|----------------------|
| Reflected/stored XSS via free-text line-item fields (`productOrService`, `sku`) rendered back into the table | Tampering / Information Disclosure | React's default JSX text-node escaping already prevents this as long as no code path uses `dangerouslySetInnerHTML` to render a line item's fields — verified no such usage exists anywhere in `src/features/pipeline` (Phase 1's components use plain JSX interpolation throughout) |
| Unbounded numeric input (`units`, `unitPrice`) causing nonsensical totals (e.g., negative units, absurdly large unit price) | Tampering | zod schema constraints — mirror `addDealSchema`'s existing `.positive()` pattern for `value` (`add-deal-schema.ts:12`) on `units`/`unitPrice`; this is a data-integrity control, not strictly a security control, but belongs in the same schema |

## Sources

### Primary (HIGH confidence)
- `src/shared/types/deal.ts`, `src/data/deals-repository.ts`, `src/data/mock/mock-deals-repository.ts`, `src/features/pipeline/store/pipelineStore.ts`, `src/features/pipeline/components/{DealTable,StageSelect,AddDealDialog,GroupSection}.tsx`, `src/features/pipeline/components/add-deal-schema.ts`, `src/components/ui/{dialog,field}.tsx`, `package.json` — all read directly this session (2026-09-07)
- `.planning/phases/01-pipeline-board-foundation/01-02-SUMMARY.md`, `01-03-SUMMARY.md`, `01-04-SUMMARY.md` — read directly this session
- `.planning/research/ARCHITECTURE.md`, `PITFALLS.md`, `FEATURES.md` — read directly this session
- `.planning/phases/02-deal-detail-line-items/02-CONTEXT.md` — read directly this session (authoritative for all locked decisions and discretion framing)

### Secondary (MEDIUM confidence)
- shadcn/ui Sheet component docs (`ui.shadcn.com/docs/components/sheet`) via WebSearch — `side` prop, composable parts, install command
- TanStack Table editable-cell `meta.updateData` convention (`tanstack.com/table` docs) via WebSearch
- react-hook-form `useFieldArray` API (`react-hook-form.com/docs/usefieldarray`) via WebSearch

### Tertiary (LOW confidence)
- "Computed until touched" pattern — synthesized from general React derived-state discussion (Medium/dev.to articles, react-hook-form GitHub discussions) via WebSearch, not from a single authoritative source; treat the specific rounding/divergence-detection implementation in this document as this project's own design, not an established library pattern

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every library is already installed and verified in `package.json`; no new dependency introduced
- Architecture: HIGH — extends Phase 1's verified, working repository/store/component patterns directly, with concrete file:line citations
- Pitfalls: HIGH for Pitfalls 1, 2, 4, 5 (all verified against this session's direct reads of the actual source files); MEDIUM for Pitfall 3 (float-precision is a well-known JS behavior, not project-specific)
- DEAL-05 rollup/override design: LOW-MEDIUM — genuinely synthesized, not a settled library pattern; flagged in Assumptions Log and Open Questions for user confirmation

**Research date:** 2026-09-07
**Valid until:** 30 days (stable stack, no fast-moving dependencies in this phase's scope)
