import { z } from "zod";

/**
 * Validation for the deal detail drawer's auto-committing core-field edits
 * (DEAL-02/DEAL-03). Mirrors `add-deal-schema.ts`'s exact two-type-export
 * convention. Only `name` is validated here — `value`/`owner`/`closeDate`
 * are added by plan 02-01's Task 2 once those fields exist in the drawer.
 */
export const dealEditSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export type DealEditFormValues = z.infer<typeof dealEditSchema>;

/**
 * Pre-coercion input shape — needed so the zod resolver's input/output types
 * line up, mirroring `AddDealFormInput`'s rationale in add-deal-schema.ts.
 */
export type DealEditFormInput = z.input<typeof dealEditSchema>;
