# Phase 3: Deal Terms Wizard - Pattern Map

**Mapped:** 2026-09-09
**Files analyzed:** 6
**Analogs found:** 6 / 6 (all modifications of existing files — each file is its own analog/predecessor)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `src/shared/types/deal.ts` | model | CRUD | itself (extend in place) | exact |
| `src/features/pipeline/components/add-deal-schema.ts` | utility (zod schema) | request-response (form validation) | itself (extend in place) | exact |
| `src/features/pipeline/components/AddDealDialog.tsx` | component | request-response (form submit) | itself (convert to 2-step wizard) | exact |
| `src/data/mock/mock-deals-repository.ts` (`create()`) | service | CRUD | itself (extend field mapping) | exact |
| `src/data/mock/seed-data.ts` (`buildSeedDeal`) | utility (seed/faker) | batch | itself (extend field generation) | exact |
| `src/components/ui/select.tsx` | component (shadcn primitive) | request-response | already used by `StageSelect`/group picker in `AddDealDialog.tsx` | exact (reuse, no changes needed) |

No brand-new files are required this phase — every deliverable is a targeted extension of an existing file. This is unusual but correct: the wizard is a structural conversion of `AddDealDialog.tsx`, not a new component tree.

## Pattern Assignments

### `src/shared/types/deal.ts` (model)

**Analog:** itself — current shape at lines 41-71.

**Current `Deal` interface** (lines 41-57):
```typescript
export interface Deal {
  id: string;
  name: string;
  company: string;
  value: number;
  owner: string;
  closeDate: string;
  pipelineStage: PipelineStage;
  outcome: DealOutcome;
  lostReason?: string;
  createdAt: string;
  lineItems: LineItem[];
}
```
Add 5 flat fields (per CONTEXT.md Claude's Discretion — flat, matching existing convention, no nested `contractTerms` object):
```typescript
prorata: boolean;
gracePeriodDays: number;
contractTermMonths: number;
frequency: DealFrequency; // new union type, e.g. "monthly" | "quarterly" | "quadrimestral" | "semi-annual" | "annually"
currency: DealCurrency;   // new union type, e.g. "USD" | "EUR" | "GBP"
```
Follow the existing convention seen for `PipelineStage`/`DealOutcome`/`LineItemType` (lines 11-24): a dedicated exported string-literal union type per enum-like field, placed above the interface, with a one-line doc comment.

**Current `NewDealInput` interface** (lines 64-71):
```typescript
export interface NewDealInput {
  name: string;
  company: string;
  value: number;
  owner: string;
  closeDate: string;
  group: PipelineGroup;
}
```
Add the same 5 fields here too (the wizard step 2 payload merges into this same input shape — no parallel type, per "Integration Points": `dealsRepository.create(input: NewDealInput)` stays the single creation path).

---

### `src/features/pipeline/components/add-deal-schema.ts` (utility, zod schema)

**Analog:** itself — full file, lines 1-27.

**Existing schema pattern** (lines 9-16):
```typescript
export const addDealSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().min(1, "Company is required"),
  value: z.coerce.number().positive("Value must be positive"),
  owner: z.string().min(1, "Owner is required"),
  closeDate: z.string().min(1, "Close date is required"),
  group: z.enum(["prospect", "lead", "opportunity", "deal", "lost"]),
});

export type AddDealFormValues = z.infer<typeof addDealSchema>;
export type AddDealFormInput = z.input<typeof addDealSchema>;
```

**Pattern to copy for step 2 (deal-terms) fields:**
- `prorata`: boolean selector via 2-option select (no radio/switch primitive exists) — model as `z.enum(["yes", "no"])` transformed to boolean, OR `z.coerce.boolean()` if using a native checkbox-like control. Recommend `z.enum(["yes","no"]).transform(v => v === "yes")` to stay consistent with the `Select`-based UI decision in CONTEXT.md.
- `gracePeriodDays`: numeric, non-negative, allow 0 — mirror `value`'s `z.coerce.number()` pattern but with `.nonnegative()` instead of `.positive()`, consistent with "Whether Grace Period / Contract Term allow 0" discretion note. Same two-generic coercion workaround as `value` (line 12) — needed because `z.coerce.number()` requires `AddDealFormInput` (via `z.input<>`) as the RHF field-values generic, not `AddDealFormValues`.
- `contractTermMonths`: numeric, non-negative, same coercion pattern as above.
- `frequency`: `z.enum(["monthly", "quarterly", "quadrimestral", "semi-annual", "annually"])`, same shape as `group`'s `z.enum(...)` (line 15).
- `currency`: `z.enum(["USD", "EUR", "GBP"])`, same shape as `group`.

**Structural decision for planner:** Two sub-schemas recommended — `addDealStep1Schema` (today's `addDealSchema` fields) and `addDealStep2Schema` (5 new fields), composed via `.merge()` or `z.object({...step1.shape, ...step2.shape})` into a combined `addDealSchema` for final submit validation. This lets `AddDealDialog.tsx` validate step 1 fields before allowing "Next" (via `form.trigger([...step1 field names])`) while keeping one `useForm` instance across both steps — avoiding two coordinated `useForm` instances (CLAUDE.md flags this as an open implementation choice; single-form-with-step-gated-visibility is the simpler option given RHF is already wired this way in `AddDealDialog.tsx`).

Same `AddDealFormValues`/`AddDealFormInput` two-generic export pattern (lines 18, 27) should be kept, just widened to include the 5 new fields.

---

### `src/features/pipeline/components/AddDealDialog.tsx` (component)

**Analog:** itself — full file, lines 1-183.

**Imports pattern** (lines 1-25) — unchanged, reuse as-is; add `useState` from React for step tracking.

**Field-Controller pattern to copy verbatim for each new field** (e.g. lines 107-125, the `value` field, and lines 153-174, the `group`/Select field):
```typescript
<Controller
  name="gracePeriodDays"
  control={form.control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel htmlFor={field.name}>Grace Period (days)</FieldLabel>
      <Input
        {...field}
        value={(field.value as string | number | undefined) ?? ""}
        id={field.name}
        type="number"
        min={0}
        step="1"
        aria-invalid={fieldState.invalid}
      />
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>
```
For `frequency`/`currency`/`prorata` (all selectors), copy the `group` Select pattern verbatim (lines 153-174), defining `FREQUENCY_OPTIONS`, `CURRENCY_OPTIONS`, `PRORATA_OPTIONS` constants the same way `GROUP_OPTIONS` is defined (lines 28-34):
```typescript
const GROUP_OPTIONS: { value: AddDealFormValues["group"]; label: string }[] = [
  { value: "prospect", label: "Prospect" },
  ...
];
```

**DEFAULT_VALUES pattern** (lines 36-43) — extend with defaults for the 5 new fields (e.g. `prorata: "no"`, `gracePeriodDays: 0`, `contractTermMonths: 0`, `frequency: "monthly"`, `currency: "USD"`).

**Dialog structure to restructure** (lines 77-183): Wrap current single `<form>`'s field block in step-conditional rendering. Introduce local `const [step, setStep] = useState<1 | 2>(1)`. Step 1 renders today's `FieldGroup` (lines 84-175 minus the final submit); Step 2 renders the new 5-field `FieldGroup`. `DialogFooter` (lines 176-178) becomes conditional: step 1 shows "Next" (calls `form.trigger([step1 field names])` then `setStep(2)` if valid); step 2 shows "Back" (`setStep(1)`, no value loss since it's the same `useForm` instance) and "Create Deal" (submit, same `onSubmit` lines 64-68 logic, unchanged since `NewDealInput` already carries all fields once schema/type are extended).

**Reset-on-close pattern** (lines 70-75) — extend to also reset `step` back to 1 on close:
```typescript
const handleOpenChange = (next: boolean) => {
  if (!next) {
    form.reset(DEFAULT_VALUES);
    setStep(1);
  }
  onOpenChange(next);
};
```

**Cancel button** — not present today (Dialog's built-in close/X and backdrop-click cover "Cancel closes from either step," per D-02). If an explicit Cancel button is added, reuse the `Button` import (line 12) with `variant="outline"` calling `handleOpenChange(false)` directly — verify actual `Button` variant names in `src/components/ui/button.tsx` before use.

---

### `src/data/mock/mock-deals-repository.ts` (`create()`) (service, CRUD)

**Analog:** itself — lines 37-55.

**Current create() pattern:**
```typescript
create(input: NewDealInput): Promise<Deal> {
  const { pipelineStage, outcome } = fromPipelineGroup(input.group);
  const deal: Deal = {
    id: generateDealId(),
    name: input.name,
    company: input.company,
    value: input.value,
    owner: input.owner,
    closeDate: input.closeDate,
    pipelineStage,
    outcome,
    createdAt: new Date().toISOString(),
    lineItems: [],
  };
  this.deals.push(deal);
  return Promise.resolve(deal);
}
```
Extend the `deal` object literal with the 5 new fields copied straight from `input` (`prorata: input.prorata`, `gracePeriodDays: input.gracePeriodDays`, `contractTermMonths: input.contractTermMonths`, `frequency: input.frequency`, `currency: input.currency`) — no transform needed, mirrors how `name`/`company`/`value`/`owner`/`closeDate` pass through unchanged today.

---

### `src/data/mock/seed-data.ts` (`buildSeedDeal`) (utility, batch/faker)

**Analog:** itself — lines 21-53.

**Current field-generation pattern** (lines 38-52), each field generated via a `faker.*` call inline in the returned object literal:
```typescript
return {
  id: faker.string.numeric(10),
  name: faker.company.buzzPhrase(),
  company: faker.company.name(),
  value: lineItems.length > 0 ? sumLineItems(lineItems) : faker.number.int({ min: 5_000, max: 250_000 }),
  owner: faker.person.fullName(),
  closeDate: faker.date.soon({ days: 90 }).toISOString(),
  pipelineStage,
  outcome: isLost ? "lost" : "open",
  createdAt: faker.date.recent({ days: 60 }).toISOString(),
  lineItems,
};
```
Add the 5 new fields using the same inline-faker-call convention:
```typescript
prorata: faker.datatype.boolean(),
gracePeriodDays: faker.number.int({ min: 0, max: 90 }),
contractTermMonths: faker.number.int({ min: 0, max: 60 }),
frequency: faker.helpers.arrayElement(FREQUENCIES),
currency: faker.helpers.arrayElement(CURRENCIES),
```
Define `FREQUENCIES`/`CURRENCIES` module-level const arrays the same way `STAGES`/`LINE_ITEM_TYPES` are defined at the top of the file (lines 5-6):
```typescript
const STAGES: PipelineStage[] = ["prospect", "lead", "opportunity", "deal"];
const LINE_ITEM_TYPES: LineItemType[] = ["product", "service"];
```

---

## Shared Patterns

### react-hook-form + zod + shadcn Field/Controller
**Source:** `src/features/pipeline/components/AddDealDialog.tsx` lines 1-25 (imports), 85-125 (text/number Controller), 153-174 (Select Controller)
**Apply to:** All 5 new step-2 fields in the wizard.
```typescript
<Controller
  name="<fieldName>"
  control={form.control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel htmlFor={field.name}>{/* label */}</FieldLabel>
      {/* Input or Select */}
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>
```

### Two-generic `useForm` for `z.coerce.number()`
**Source:** `src/features/pipeline/components/AddDealDialog.tsx` line 59, `add-deal-schema.ts` lines 18-27
**Apply to:** `gracePeriodDays` and `contractTermMonths` (both numeric, both need `z.coerce.number()`), same as existing `value` field.
```typescript
const form = useForm<AddDealFormInput, unknown, AddDealFormValues>({
  resolver: zodResolver(addDealSchema),
  defaultValues: DEFAULT_VALUES,
});
```

### shadcn Select for enum fields
**Source:** `src/features/pipeline/components/AddDealDialog.tsx` lines 13-19 (import), 153-174 (usage), 28-34 (options array)
**Apply to:** `frequency`, `currency`, and `prorata` (2-option select, per CONTEXT.md — no radio/switch primitive exists yet).

### Repository seam — extend, don't parallel
**Source:** `src/data/index.ts`, `src/data/mock/mock-deals-repository.ts` lines 37-55
**Apply to:** `create()` — extend the object literal and `NewDealInput`, never add a second creation method or bypass `dealsRepository`.

### Faker-based seed generation
**Source:** `src/data/mock/seed-data.ts` lines 5-6 (const arrays), 38-52 (inline faker calls)
**Apply to:** `buildSeedDeal()` extension for the 5 new required fields, keeping all 40 seed deals valid against the extended `Deal` type.

## No Analog Found

None — every file in scope is a direct extension of an existing, already-analyzed file. No brand-new component/service/model is being introduced this phase.

## Metadata

**Analog search scope:** `src/shared/types/`, `src/features/pipeline/components/`, `src/data/mock/`, `src/data/`, `src/components/ui/`
**Files scanned:** `deal.ts`, `add-deal-schema.ts`, `AddDealDialog.tsx`, `seed-data.ts`, `mock-deals-repository.ts`, `pipelineStore.ts`, `index.ts` (data), `select.tsx`
**Pattern extraction date:** 2026-09-09
