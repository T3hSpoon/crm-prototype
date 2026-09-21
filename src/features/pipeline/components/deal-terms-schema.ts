import type { z } from "zod";
import { addDealStep2Schema } from "@/features/pipeline/components/add-deal-schema";

/**
 * Schema for the Deal Terms inspect/edit form (quick task 260921-e8z), which
 * lets a user view/correct the 7 deal-terms fields on an existing deal after
 * creation. A direct alias of `addDealStep2Schema` — not a redefinition — so
 * editing an existing deal's terms is validated identically (same enums,
 * same Grace Period/Contract Term bounds) to creating one via AddDealDialog's
 * step 2. Never diverge these two schemas without an explicit decision.
 */
export const dealTermsSchema = addDealStep2Schema;

export type DealTermsFormValues = z.infer<typeof dealTermsSchema>;

/**
 * Pre-coercion input shape (`gracePeriodDays`/`contractTermMonths` are
 * `unknown` prior to `z.coerce.number()` running) — needed so
 * react-hook-form's field-values type lines up with the zod resolver's
 * input/output types, mirroring `AddDealFormInput`'s rationale in
 * add-deal-schema.ts.
 */
export type DealTermsFormInput = z.input<typeof dealTermsSchema>;
