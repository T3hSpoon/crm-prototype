# Quick Task 260910-ec8: Add three new field groups to Add Deal wizard step 2 - Research

**Researched:** 2026-09-10
**Domain:** React form fields (react-hook-form + zod), extending an existing wizard step
**Confidence:** HIGH — all findings are direct reads of the actual source files in this repo, no external libraries involved.

## Summary

This is a same-shape extension of an existing, well-established pattern, not a new architecture. Step 2 of `AddDealDialog.tsx` already has five `Controller`-wrapped `Select`/`Input` fields driven by `addDealStep2Schema`; the three new field groups (Customer Type select, Confidence Level select, four numeric financial inputs) copy that exact convention.

The one genuinely new problem is the ARR / Lifetime Contract Value auto-calc. **The existing DEAL-05 "auto-track with manual override" pattern (`sumLineItems`/`hasManualOverride` in `src/shared/utils/line-items.ts`) is a *post-creation* pattern that compares two fields on an already-persisted `Deal` object** (`deal.value` vs. `sumLineItems(deal.lineItems)`), recomputed fresh on every render from the Zustand-store-held `Deal`. There is no equivalent for "two fields inside a single in-progress react-hook-form instance, before the record exists." Reusing the *identical* helper functions is not feasible as-is; the *shape* (comparison-based, no extra stored boolean, recomputed each time) is exactly what should be mirrored, using react-hook-form's own live-state primitives (`watch`/`useWatch` + `formState.dirtyFields`) instead of a persisted-`Deal` comparison. See Pitfalls section for the two known react-hook-form gotchas that make `dirtyFields` alone insufficient.

**Primary recommendation:** Add `customerType` and `confidenceLevel` as required zod enums with defaults, following the `prorata`/`frequency`/`currency` `Select` convention exactly. Add `arpu`, `mrr`, `arr`, `lifetimeContractValue` as optional `z.coerce.number()` fields following the `gracePeriodDays`/`contractTermMonths` bounded-`Input` convention (but optional, not required-with-default). Implement the ARR/LTV auto-calc with a `useEffect` that watches `mrr` (and `contractTermMonths`) via `form.watch`, and only calls `form.setValue("arr"/"lifetimeContractValue", …)` when the corresponding field has not been manually dirtied — tracked via `formState.dirtyFields.arr`/`dirtyFields.lifetimeContractValue`, NOT `defaultValue` comparison (dirty tracking survives being cleared back to the default, which a value-comparison approach would misreport as "not overridden").

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Customer Type / Confidence Level enum capture | Frontend (React form) | Shared types (`deal.ts`) | Pure form input + type definition, same tier as existing `frequency`/`currency` |
| ARR / LTV live auto-calc | Frontend (React form, in-wizard) | — | Must happen client-side, pre-persistence, inside `AddDealDialog`'s single `useForm` instance — no store/repository involvement until submit |
| Persisted financial fields | Mock repository / seed data | Shared types (`deal.ts`) | Pass-through fields on `Deal`/`NewDealInput`, identical tier to existing deal-terms fields |

## User Constraints

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Run as a quick task with the full quality pipeline (discussion + research + plan-checking + verification).
- All three new field groups are added to the Add Deal wizard's **existing step 2** — not a new step 3.
- Customer Type and Confidence Level are **required** enum fields, each with a **pre-selected default** (never blank/unset) — matches the existing step-2 convention.
- Suggested defaults (Claude's Discretion, confirm during planning): Customer Type defaults to "Similar"; Confidence Level defaults to "Open to RFP Bids."
- This carries forward the accepted-risk shape of Phase 3's DEAL-06 prohibition (`03-SECURITY.md` AR-03-01: an untouched default is indistinguishable from deliberate entry). Do not re-litigate.
- **Locked decision for Phase 4 planning (not implemented this task):** Confidence Level is intended to REPLACE the stage-probability placeholders (Prospect 10%/Lead 25%/Opportunity 50%/Deal 80-90%) as the input to Phase 4's weighted pipeline value calc. Mapping: 100%→1.0, 80%→0.8, 50%→0.5, Open to RFP Bids→0.0. This task only captures the `confidenceLevel` field with correct enum values — no forecast-page/weighting logic.
- All four financial fields (ARPU, MRR, ARR, Lifetime Contract Value) are **optional** numeric inputs — deliberate departure from "every step-2 field is required," because early-stage deals often lack firm numbers.
- **ARR** and **Lifetime Contract Value** auto-derive from already-captured data when left blank, using the SAME auto-track-with-manual-override *pattern shape* established for `Deal.value` (DEAL-05): typing a value into ARR or LTV overrides the computed one; leaving it blank keeps it auto-tracking.
  - ARR = MRR × 12 (when MRR entered and ARR untouched).
  - Lifetime Contract Value = MRR × Contract Term (months) (existing `contractTermMonths` field) — equivalently ARR × (contractTermMonths / 12) — when MRR entered and LTV untouched.
- **ARPU is NOT auto-calculated from anything** — always an independently-entered, optional number. No field in this project represents a unit/seat count, so no mechanical derivation is possible. Do not invent one.
- If MRR is left blank, ARR and LTV have nothing to auto-track toward and stay blank/0 until entered directly — same "sum of nothing is 0/blank" behavior DEAL-05 established for `value` with zero line items.

### Claude's Discretion
- Exact default enum values for Customer Type ("Similar") and Confidence Level ("Open to RFP Bids") — planner should confirm these read naturally as UI copy.
- Whether ARR/LTV auto-calc reuses DEAL-05's exact helper functions or parallel ones with the same shape — per this research's findings below, DEAL-05's helpers operate on a persisted `Deal` and are NOT directly reusable inside the pre-creation wizard form; a parallel, same-shape mechanism is required (see Architecture Patterns / Pitfalls below).
- Field ordering within step 2's `FieldGroup`, and exact validation bounds (e.g. a sane upper bound on ARPU/MRR/ARR/LTV mirroring the existing Grace Period/Contract Term `.max()` pattern) — left to planner, following established codebase conventions for bounded numeric fields.
- Whether these new fields also need a pipeline-table column — NOT requested this task; out of scope unless trivially cheap.

### Deferred Ideas (OUT OF SCOPE)
- Phase 4's forecast-page weighted-value logic using Confidence Level — not planned yet, not touched this task; only the locked mapping decision is recorded (above) for whenever Phase 4 is planned.
- A pipeline-table column for any of the six new fields.
</user_constraints>

## Phase Requirements

No formal REQUIREMENTS.md IDs apply — this is a quick task extending Phase 3's DEAL-06 step-2 form. The relevant prior requirement ID for context: **DEAL-06** (Add Deal wizard step 2, deal-terms fields) — this task extends that same step with 3 additional field groups per CONTEXT.md decisions above.

## Standard Stack

No new dependencies. Everything needed is already installed and in use: `react-hook-form@^7.86.0`, `zod@^4.4.3`, `@hookform/resolvers@^5.9.1`, shadcn/ui `Select`/`Input`/`Field*` components.

## Current Code Shape (read in full this session)

### `src/shared/types/deal.ts` [VERIFIED: src/shared/types/deal.ts:26-30]
Doc-comment convention for existing union types, quoted verbatim:
```
/** Billing cadence for a deal's contract terms (Phase 3, DEAL-06). */
export type DealFrequency = "monthly" | "quarterly" | "quadrimestral" | "semi-annual" | "annually";

/** Contract currency for a deal's deal-terms fields (Phase 3, DEAL-06). */
export type DealCurrency = "USD" | "EUR" | "GBP";
```
`Deal` interface fields end at [VERIFIED: src/shared/types/deal.ts:63-69]:
```
  /** Deal-terms fields captured via the Add Deal wizard's step 2 (Phase 3, DEAL-06). */
  prorata: boolean;
  gracePeriodDays: number;
  contractTermMonths: number;
  frequency: DealFrequency;
  currency: DealCurrency;
}
```
`NewDealInput` interface ends identically at [VERIFIED: src/shared/types/deal.ts:83-89]:
```
  /** Deal-terms fields captured via the Add Deal wizard's step 2 (Phase 3, DEAL-06). */
  prorata: boolean;
  gracePeriodDays: number;
  contractTermMonths: number;
  frequency: DealFrequency;
  currency: DealCurrency;
}
```
New union types (`CustomerType`, `ConfidenceLevel`) and 6 new fields (`customerType`, `confidenceLevel`, `arpu`, `mrr`, `arr`, `lifetimeContractValue`) belong immediately after these blocks on both `Deal` and `NewDealInput`, following the exact same doc-comment + placement convention.

Note the `ConfidenceLevel` union CANNOT be numeric — CONTEXT.md flags "Open to RFP Bids" is a non-numeric label distinct from the three percentage values, so the stored type must be a 4-member string enum (e.g. `"100" | "80" | "50" | "open-to-rfp"`), never attempt numeric coercion on it directly.

### `src/features/pipeline/components/add-deal-schema.ts` [VERIFIED: src/features/pipeline/components/add-deal-schema.ts:31-45]
Exact current `addDealStep2Schema`, quoted verbatim:
```
export const addDealStep2Schema = z.object({
  prorata: z.enum(["yes", "no"], { message: "Prorata is required" }),
  gracePeriodDays: z.coerce
    .number()
    .nonnegative("Grace period is required")
    .max(3650, "Grace period must be 3650 days or fewer"),
  contractTermMonths: z.coerce
    .number()
    .nonnegative("Contract term is required")
    .max(600, "Contract term must be 600 months or fewer"),
  frequency: z.enum(["monthly", "quarterly", "quadrimestral", "semi-annual", "annually"], {
    message: "Frequency is required",
  }),
  currency: z.enum(["USD", "EUR", "GBP"], { message: "Currency is required" }),
});
```
New required-enum fields (`customerType`, `confidenceLevel`) follow the `frequency`/`currency` `z.enum(..., { message: ... })` shape exactly. New optional numeric fields (`arpu`, `mrr`, `arr`, `lifetimeContractValue`) need `.optional()` added to a `z.coerce.number().nonnegative().max(...)` chain — this is new territory (no existing optional-numeric field in this schema to copy verbatim), but zod 4's `.optional()` composes onto any chain the same way `.nonnegative()`/`.max()` already do here.

`addDealSchema` composes step1+step2 via shape-spread (not `.merge()`) — [VERIFIED: src/features/pipeline/components/add-deal-schema.ts:54-57] `z.object({ ...addDealStep1Schema.shape, ...addDealStep2Schema.shape })` — new fields land automatically once added to `addDealStep2Schema.shape`, no other change needed there.

### `src/features/pipeline/components/AddDealDialog.tsx` [VERIFIED: src/features/pipeline/components/AddDealDialog.tsx:59-71]
`DEFAULT_VALUES` object, quoted verbatim:
```
const DEFAULT_VALUES: AddDealFormInput = {
  name: "",
  company: "",
  value: 0,
  owner: "",
  closeDate: "",
  group: "prospect",
  prorata: "no",
  gracePeriodDays: 0,
  contractTermMonths: 0,
  frequency: "monthly",
  currency: "USD",
};
```
New entries: `customerType: "similar"`, `confidenceLevel: "open-to-rfp"` (required, defaulted — matches convention), and `arpu: undefined`/`mrr: undefined`/`arr: undefined`/`lifetimeContractValue: undefined` (or `""`, matching the `value ?? ""` pattern already used for optional-looking numeric `Input`s at lines 234/253) since these are optional.

Existing `Select` field render pattern (e.g. `frequency`, [VERIFIED: src/features/pipeline/components/AddDealDialog.tsx:264-285], quoted):
```
<Controller
  name="frequency"
  control={form.control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel htmlFor={field.name}>Frequency</FieldLabel>
      <Select value={field.value} onValueChange={field.onChange}>
        <SelectTrigger id={field.name} aria-invalid={fieldState.invalid} className="w-full">
          <SelectValue placeholder="Select a frequency" />
        </SelectTrigger>
        <SelectContent>
          {FREQUENCY_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>
```
`customerType`/`confidenceLevel` copy this exactly, with new `CUSTOMER_TYPE_OPTIONS`/`CONFIDENCE_LEVEL_OPTIONS` arrays declared alongside `FREQUENCY_OPTIONS`/`CURRENCY_OPTIONS`/`PRORATA_OPTIONS` at the top of the file [VERIFIED: src/features/pipeline/components/AddDealDialog.tsx:38-57].

Existing bounded numeric `Input` field pattern (e.g. `contractTermMonths`, [VERIFIED: src/features/pipeline/components/AddDealDialog.tsx:245-263], quoted):
```
<Controller
  name="contractTermMonths"
  control={form.control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel htmlFor={field.name}>Contract Term (months)</FieldLabel>
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
`arpu`/`mrr`/`arr`/`lifetimeContractValue` copy this shape. `arr` and `lifetimeContractValue` additionally need the auto-calc `useEffect` wiring described below — their `Controller`/`Field`/`Input` JSX stays identical to this pattern; only the surrounding effect and (optionally) a placeholder/helper-text indicating "auto-calculated" differs.

### `src/data/mock/mock-deals-repository.ts` [VERIFIED: src/data/mock/mock-deals-repository.ts:37-59]
`create()` is direct pass-through, no transform, quoted (deal-terms fields section):
```
      // Deal-terms fields, captured via the Add Deal wizard's step 2
      // (Phase 3, DEAL-06) — direct pass-through, no transform.
      prorata: input.prorata,
      gracePeriodDays: input.gracePeriodDays,
      contractTermMonths: input.contractTermMonths,
      frequency: input.frequency,
      currency: input.currency,
    };
```
The 6 new fields (`customerType`, `confidenceLevel`, `arpu`, `mrr`, `arr`, `lifetimeContractValue`) get the identical pass-through treatment — no repository-layer computation; the wizard is responsible for having already resolved ARR/LTV to their final numbers (auto-calc or manual override) before `addDeal()` is called.

### `src/data/mock/seed-data.ts` [VERIFIED: src/data/mock/seed-data.ts:61-66]
`buildSeedDeal()`'s deal-terms fields, quoted:
```
    prorata: faker.datatype.boolean(),
    gracePeriodDays: faker.number.int({ min: 0, max: 90 }),
    contractTermMonths: faker.number.int({ min: 0, max: 60 }),
    frequency: faker.helpers.arrayElement(FREQUENCIES),
    currency: faker.helpers.arrayElement(CURRENCIES),
```
with `FREQUENCIES`/`CURRENCIES` arrays declared at [VERIFIED: src/data/mock/seed-data.ts:14-15]. New seed fields follow the same `faker.helpers.arrayElement(CUSTOMER_TYPES)`/`faker.helpers.arrayElement(CONFIDENCE_LEVELS)` convention for the two enums, and `faker.number.int({...})` for ARPU/MRR (with ARR/LTV computed from MRR×12 / MRR×contractTermMonths in the seed generator too, to keep seed data internally consistent — since seed deals never go through the wizard's live auto-calc effect).

## Architecture Patterns

### Pattern: DEAL-05's actual auto-track-with-manual-override shape (post-creation, NOT directly reusable)

**What it is** [VERIFIED: src/shared/utils/line-items.ts:37-46], quoted verbatim:
```
export function hasManualOverride(deal: Pick<Deal, "value" | "lineItems">): boolean {
  if (deal.lineItems.length === 0) return false;
  return round2(deal.value) !== round2(sumLineItems(deal.lineItems));
}
```
This is called at the **caller** site, not inside a form — [VERIFIED: src/features/pipeline/components/DealTable.tsx:167], quoted: `overridden={hasManualOverride(row.original)}` — where `row.original` is a live, persisted `Deal` object held in the Zustand store (`usePipelineStore`). The comparison is `storedValue !== computedFromOtherStoredFields`, recomputed on every render because `Deal` itself is the single source of truth, and the `LineItemsTable` component (a *separate* `useForm` instance for line-item CRUD, distinct from the deal-terms form) reads `overridden` as a prop and gates its own commit/reset UI on it (`src/features/pipeline/components/LineItemsTable.tsx:60-141`).

**Why it does NOT transplant directly into the wizard:** DEAL-05's `hasManualOverride` needs a `Deal` (with a `value` field already resolved) to exist. Inside `AddDealDialog`'s step 2, there is no `Deal` yet — only in-progress `react-hook-form` field state, and `arr`/`lifetimeContractValue` are *themselves* the fields being computed, not separate persisted fields being compared against a derived sum. The "override" signal here must come from react-hook-form's own field-state (was this field's value user-typed, vs. programmatically set by the effect), not a value-vs-computed-value comparison — a value-comparison approach breaks the moment a user manually types the exact same number the auto-calc would have produced (indistinguishable from "not touched"), which is a real gap `hasManualOverride`'s design doesn't have to deal with, because DEAL-05's line items always start empty on a new deal (an empty deal has nothing to accidentally match).

**Confirmed:** `form.watch()` is already an established pattern in this codebase for exactly this kind of "react to sibling field changes for display purposes" case — [VERIFIED: src/features/pipeline/components/LineItemsTable.tsx:170], quoted: `const rowValues = form.watch(\`lineItems.${index}\`);` used to recompute a display-only subtotal live as the user types. No prior use of `formState.dirtyFields` or `useWatch` exists in this codebase — this task introduces the first use of dirty-field tracking.

### Recommended approach for ARR / Lifetime Contract Value live auto-calc

1. Watch `mrr` (and `contractTermMonths`, already on the form from step 2) via `form.watch(["mrr", "contractTermMonths"])` or a `useEffect` with `form.watch` subscription (RHF 7's `watch()` called with no args inside a `useEffect`'s cleanup-returning subscription form, or the simpler `useWatch({ control: form.control, name: ["mrr", "contractTermMonths"] })` hook — either works with RHF 7.86; `useWatch` is the more idiomatic RHF7 choice for effect-driving values since it's a proper hook, not an imperative subscription needing manual cleanup).
2. In a `useEffect` keyed on the watched `mrr`/`contractTermMonths` values: if `mrr` has a value, compute `nextArr = mrr * 12` and `nextLtv = mrr * contractTermMonths`. Call `form.setValue("arr", nextArr, { shouldDirty: false, shouldValidate: false })` **only if** `!form.formState.dirtyFields.arr` — same for `lifetimeContractValue`. `shouldDirty: false` is essential: without it, the programmatic `setValue` call would itself mark the field dirty on the *next* effect run, permanently locking it into "manually overridden" mode after the very first auto-calc write.
3. If `mrr` is blank/undefined, leave `arr`/`lifetimeContractValue` as-is (matches CONTEXT.md's "stay blank/0 until entered directly").
4. The "has this field been manually touched" signal is `formState.dirtyFields.arr` (and `.lifetimeContractValue`) — this is the RHF-native, no-extra-state equivalent of DEAL-05's comparison-based detection: no separate `hasManualOverrideArr` boolean is stored anywhere, it's derived live from RHF's own tracked field-touch state, mirroring DEAL-05's "no stored flag" principle even though the mechanism differs.
5. On step navigation Back/Next or dialog reset, `form.reset(DEFAULT_VALUES)` already runs [VERIFIED: src/features/pipeline/components/AddDealDialog.tsx:99, 106] and RHF's `reset()` clears `dirtyFields` back to empty — so re-opening the dialog correctly resets ARR/LTV to "auto-tracking" state with no extra cleanup code needed.

```typescript
// Illustrative shape only — exact wiring is the planner/executor's job.
const mrr = useWatch({ control: form.control, name: "mrr" });
const contractTermMonths = useWatch({ control: form.control, name: "contractTermMonths" });

useEffect(() => {
  const mrrNum = Number(mrr);
  if (!mrr || Number.isNaN(mrrNum)) return;
  if (!form.formState.dirtyFields.arr) {
    form.setValue("arr", mrrNum * 12, { shouldDirty: false, shouldValidate: false });
  }
  if (!form.formState.dirtyFields.lifetimeContractValue) {
    const termNum = Number(contractTermMonths) || 0;
    form.setValue("lifetimeContractValue", mrrNum * termNum, {
      shouldDirty: false,
      shouldValidate: false,
    });
  }
}, [mrr, contractTermMonths]); // eslint-disable-line react-hooks/exhaustive-deps -- form/setValue stable refs
```

An explicit "reset to auto" affordance (mirroring DEAL-05's "Reset to sum" button) is NOT required by CONTEXT.md for this task — the wizard is a single create-flow, not a revisit-and-edit flow, so there's no persisted `overridden` state a user returns to later. If the planner wants parity for UX consistency, `form.resetField("arr", { keepDirty: false })` (RHF 7 API) is the equivalent "unlock auto-tracking again" action, but this is optional/discretionary — CONTEXT.md doesn't request it.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tracking whether a live form field was manually edited | A custom `touched`/`overridden` `useState` boolean pair | `form.formState.dirtyFields` | RHF already tracks this per-field; a parallel `useState` can drift out of sync with RHF's own reset/setValue lifecycle (e.g. forgetting to clear it on `form.reset()`) |
| Watching sibling field values inside a `useEffect` | Manual `field.onChange` interception + local state mirror | `useWatch({ control, name })` | Already the codebase's established mechanism (`LineItemsTable.tsx:170`) for exactly this "recompute derived value live" need |

## Common Pitfalls

### Pitfall 1: `setValue` without `shouldDirty: false` permanently locks auto-calc off
**What goes wrong:** Calling `form.setValue("arr", computed)` with default options marks `arr` dirty. The next effect run then sees `dirtyFields.arr === true` and stops auto-updating — even though the user never typed anything into ARR.
**Why it happens:** RHF's `setValue` defaults `shouldDirty: false` in v7 for the *value* itself, but historically this has been a frequent source of confusion across RHF majors — must be verified against the installed 7.86.0 behavior, not assumed from memory of an older RHF version. [ASSUMED — verify `shouldDirty` default behavior against `react-hook-form@7.86.0` during planning/implementation, e.g. via a quick manual test, since this exact default has differed across RHF minor versions and a wrong assumption here silently breaks the entire auto-calc feature.]
**How to avoid:** Always pass `{ shouldDirty: false }` explicitly on the auto-calc's `setValue` calls — never rely on the default.
**Warning signs:** Typing into MRR only updates ARR/LTV on the very first change and then stops tracking on subsequent MRR edits.

### Pitfall 2: `useWatch`/`watch()` triggers a re-render on every keystroke
**What goes wrong:** Watching `mrr` re-renders the whole step-2 `FieldGroup` on every keystroke into MRR (and, if watching a wider field set, on keystrokes into unrelated fields too).
**Why it happens:** This is how RHF's watch mechanism works by design — it's what `LineItemsTable.tsx` already accepts for its per-row subtotal display.
**How to avoid:** Scope `useWatch({ name: ["mrr", "contractTermMonths"] })` to only the two fields the effect actually needs, not the whole form, to minimize re-render surface. At this form's scale (a handful of fields, one dialog) this is a non-issue performance-wise — noted only so the planner doesn't over-engineer a `useEffect`-free alternative.

### Pitfall 3: value-comparison detection (copying DEAL-05 literally) breaks on coincidental matches
**What goes wrong:** If the auto-calc detection is implemented as "is `arr` equal to `mrr * 12`?" (mirroring `hasManualOverride`'s value-comparison shape literally) instead of using `dirtyFields`, then a user who manually types the exact auto-calculated number gets silently treated as "not overridden" and the field keeps auto-tracking — which is actually fine/harmless in that specific coincidence, but the field also incorrectly *reverts* to auto-tracking if the user later blanks MRR and re-enters a different value, discarding their manual ARR entry without warning.
**Why it happens:** Value-comparison detection has no memory of user intent, only current state — appropriate for DEAL-05 (comparing two independently-real stored fields) but not for "was field X touched," which is exactly what `dirtyFields` is for.
**How to avoid:** Use `dirtyFields`, not a value-equality check, for the wizard's arr/lifetimeContractValue override detection specifically.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `react-hook-form@7.86.0`'s `setValue` defaults `shouldDirty` such that explicit `{ shouldDirty: false }` is required (not implicitly false) to avoid locking auto-calc after first write | Architecture Patterns / Pitfall 1 | If the installed version already defaults `shouldDirty: false` on `setValue`, the explicit option is a no-op/safe; if it defaults `true`, omitting the explicit option silently breaks the auto-calc feature after one MRR edit. Low risk either way since the recommendation is to pass it explicitly regardless. |
| A2 | Suggested default enum values ("Similar" for Customer Type, "Open to RFP Bids" for Confidence Level) read naturally as UI copy | Standard Stack / DEFAULT_VALUES section | Cosmetic only — trivial to change during planning/UAT if it reads oddly |

## Open Questions

1. **Should `ConfidenceLevel`'s stored representation be the string percentages ("100"/"80"/"50") or a more forecast-friendly shape (e.g. numeric `1.0`/`0.8`/`0.5` union with a distinct `"open-to-rfp"` sentinel)?**
   - What we know: CONTEXT.md locks the eventual Phase 4 mapping (100%→1.0, 80%→0.8, 50%→0.5, Open to RFP Bids→0.0) but explicitly scopes this task to NOT implement that mapping.
   - What's unclear: Whether to store `confidenceLevel` as a 4-member string enum (`"100" | "80" | "50" | "open-to-rfp"`, decoupled from its future numeric use) or something Phase 4 could consume with less translation.
   - Recommendation: Store as a string enum (`"100" | "80" | "50" | "open-to-rfp"`) — matches this codebase's existing convention of string-literal unions for all other enum fields (`DealFrequency`, `DealCurrency`, `PipelineStage`), keeps this task decoupled from Phase 4's not-yet-planned logic, and Phase 4 can trivially map the 4 string values to their locked numeric weights at that time.

## Sources

### Primary (HIGH confidence — direct file reads this session)
- `src/shared/types/deal.ts` — full file read
- `src/features/pipeline/components/add-deal-schema.ts` — full file read
- `src/features/pipeline/components/AddDealDialog.tsx` — full file read
- `src/features/pipeline/store/pipelineStore.ts` — full file read
- `src/data/mock/mock-deals-repository.ts` — full file read
- `src/data/mock/seed-data.ts` — full file read
- `src/shared/utils/line-items.ts` — full file read
- `src/features/pipeline/components/LineItemsTable.tsx` — full file read
- `src/features/pipeline/components/DealTable.tsx` (lines 140-179) — read
- `package.json` — confirmed installed versions `react-hook-form@^7.86.0`, `zod@^4.4.3`, `@hookform/resolvers@^5.9.1`

### Tertiary (LOW confidence, flagged in Assumptions Log)
- `react-hook-form@7.86.0`'s exact `setValue({ shouldDirty })` default behavior — not verified against installed package source this session, recommendation is defensive (pass explicitly) regardless of the actual default

## Metadata

**Confidence breakdown:**
- Existing code conventions (schema/component/repository/seed shape): HIGH — every claim is a direct, verbatim-quoted read of the actual files this session
- ARR/LTV auto-calc mechanism recommendation: HIGH on the *shape* (dirtyFields-based, mirroring DEAL-05's comparison-based/no-extra-flag principle), MEDIUM on the exact RHF API defaults (see Assumption A1)
- Enum default value choices: MEDIUM — reasonable but cosmetic, not verified against any style guide

**Research date:** 2026-09-10
**Valid until:** No expiry concern — scoped entirely to this repo's own code, not an external/fast-moving dependency
