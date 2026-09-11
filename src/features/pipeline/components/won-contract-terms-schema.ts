import { z } from "zod";

/**
 * The WON-01 gate: all 4 contract-term fields are required before a deal can
 * transition to the Won ("Contracts") group. Final Contract Value is
 * intentionally not part of this schema — it's a read-only confirmation of
 * `Deal.value` rendered by `WonContractTermsDialog.tsx`, never a submitted
 * field (03.1-UI-SPEC.md Assumptions Made #2).
 */
export const wonContractTermsSchema = z.object({
  contractStartDate: z.string().min(1, "Start date is required"),
  contractEndDate: z.string().min(1, "End date is required"),
  contractSignedDate: z.string().min(1, "Signed date is required"),
  paymentTerms: z.string().min(1, "Payment terms are required"),
});

export type WonContractTermsFormValues = z.infer<typeof wonContractTermsSchema>;
