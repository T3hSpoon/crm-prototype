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

/**
 * Validation for a single line-item row (DEAL-04). `productOrService`/`sku`
 * are intentionally NOT required-non-empty — unlike Name/Owner on the deal,
 * a line item can persist with those left blank (02-02-PLAN.md must_haves,
 * DEAL-04 empty). `units`/`unitPrice` mirror Value's create-time
 * coerced-positive constraint so zero/negative numbers are rejected at
 * form-validation level, never silently accepted into a subtotal.
 */
export const lineItemSchema = z.object({
  id: z.string(),
  productOrService: z.string(),
  sku: z.string(),
  units: z.coerce.number().positive("Must be positive"),
  unitPrice: z.coerce.number().positive("Must be positive"),
  type: z.enum(["product", "service"]),
});

export const lineItemsSchema = z.object({ lineItems: z.array(lineItemSchema) });

export type LineItemsFormValues = z.infer<typeof lineItemsSchema>;

/**
 * Pre-coercion input shape for the line-items field array — same
 * `z.coerce.number()` / two-type-export rationale as `DealEditFormInput`.
 */
export type LineItemsFormInput = z.input<typeof lineItemsSchema>;
