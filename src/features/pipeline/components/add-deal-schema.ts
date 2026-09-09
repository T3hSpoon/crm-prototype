import { z } from "zod";

/**
 * Step 1 of the Add Deal wizard (DEAL-01) — today's original 6 intake
 * fields. D-01: all 6 are required (no partial-add path). D-02: `group` is
 * the stage selector — the user picks which of the 5 pipeline groups the
 * new deal starts in.
 */
export const addDealStep1Schema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().min(1, "Company is required"),
  value: z.coerce.number().nonnegative("Value must be zero or positive"),
  owner: z.string().min(1, "Owner is required"),
  closeDate: z.string().min(1, "Close date is required"),
  group: z.enum(["prospect", "lead", "opportunity", "deal", "lost"]),
});

/**
 * Step 2 of the Add Deal wizard (Phase 3, DEAL-06) — the 5 deal-terms
 * fields captured for every new deal regardless of pipeline stage (D-03).
 * All 5 are required (D-09); Grace Period and Contract Term explicitly
 * allow and default to 0 (a valid "no grace period"/"not yet set" state).
 *
 * `prorata` stays a plain `"yes" | "no"` enum here (not a `.transform()`ed
 * boolean) — under this project's tsconfig (no `strict: true`), zod 4.4.3's
 * `.transform()` output silently infers as an *optional* property on the
 * containing object type, which lets a required field be omitted without a
 * type error. `AddDealDialog.tsx`'s `onSubmit` converts "yes"/"no" to a
 * boolean before calling `addDeal()`, matching `NewDealInput.prorata`.
 */
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

/**
 * Single source of validation for the full 2-step Add Deal wizard and the
 * shape of `NewDealInput` the form ultimately produces. Composed via a
 * shape spread (not `.merge()`) — `.merge()` loses the non-optional
 * inference on `addDealStep2Schema`'s `.transform()`ed `prorata` field
 * under zod 4.4.3.
 */
export const addDealSchema = z.object({
  ...addDealStep1Schema.shape,
  ...addDealStep2Schema.shape,
});

export type AddDealFormValues = z.infer<typeof addDealSchema>;

/**
 * Pre-coercion input shape (`value`, `gracePeriodDays`, `contractTermMonths`
 * are `unknown` prior to `z.coerce.number()` running). react-hook-form's
 * `useForm` needs this as its field-values type (not `AddDealFormValues`,
 * the post-coercion output) so the zod resolver's input/output types line
 * up — see AddDealDialog.tsx's `useForm<AddDealFormInput, any,
 * AddDealFormValues>` for how the two are threaded through.
 */
export type AddDealFormInput = z.input<typeof addDealSchema>;
