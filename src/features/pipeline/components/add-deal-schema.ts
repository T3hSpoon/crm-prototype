import { z } from "zod";

/**
 * Single source of validation for the Add Deal form (DEAL-01) and the shape
 * of `NewDealInput` the form ultimately produces. D-01: all 5 intake fields
 * are required (no partial-add path). D-02: `group` is the stage selector —
 * the user picks which of the 5 pipeline groups the new deal starts in.
 */
export const addDealSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().min(1, "Company is required"),
  value: z.coerce.number().positive("Value must be positive"),
  owner: z.string().min(1, "Owner is required"),
  closeDate: z.string().min(1, "Close date is required"),
  group: z.enum(["prospect", "lead", "opportunity", "deal", "lost"]),
});

export type AddDealFormValues = z.infer<typeof addDealSchema>;

/**
 * Pre-coercion input shape (`value` is `unknown` prior to `z.coerce.number()`
 * running). react-hook-form's `useForm` needs this as its field-values type
 * (not `AddDealFormValues`, the post-coercion output) so the zod resolver's
 * input/output types line up — see AddDealDialog.tsx's `useForm<AddDealFormInput,
 * any, AddDealFormValues>` for how the two are threaded through.
 */
export type AddDealFormInput = z.input<typeof addDealSchema>;
