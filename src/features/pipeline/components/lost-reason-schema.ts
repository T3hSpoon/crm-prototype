import { z } from "zod";

/**
 * Schema for the Lost-reason gate (Phase 3.1, LOST-01). Mirrors
 * add-deal-schema.ts's `z.enum([...], { message: ... })` convention.
 * `category` is required (D-03, verbatim 5-option list); `note` is optional
 * free text (D-02).
 */
export const lostReasonSchema = z.object({
  category: z.enum(["Price", "Timing", "Competitor", "No Budget", "Other"], {
    message: "Select a reason",
  }),
  note: z.string().optional(),
});

export type LostReasonFormValues = z.infer<typeof lostReasonSchema>;
