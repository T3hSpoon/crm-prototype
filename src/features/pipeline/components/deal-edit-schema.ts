import { z } from "zod";

/**
 * Validation for the deal detail drawer's auto-committing core-field edits
 * (DEAL-02/DEAL-03). Mirrors `add-deal-schema.ts`'s exact two-type-export
 * convention and constraints.
 */
export const dealEditSchema = z.object({
  name: z.string().min(1, "Name is required"),
  value: z.coerce.number().positive("Value must be positive"),
  owner: z.string().min(1, "Owner is required"),
  closeDate: z.string().min(1, "Close date is required"),
});

export type DealEditFormValues = z.infer<typeof dealEditSchema>;

/**
 * Pre-coercion input shape — needed so the zod resolver's input/output types
 * line up, mirroring `AddDealFormInput`'s rationale in add-deal-schema.ts.
 */
export type DealEditFormInput = z.input<typeof dealEditSchema>;
