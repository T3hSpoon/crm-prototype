import type { ConfidenceLevel } from "@/shared/types/deal";

/**
 * Canonical order/label source for Phase 5's 2 new consumers — `ConfidenceCell`
 * (pipeline table inline edit) and the Forecast page's confidence-grouped
 * breakdown table (`forecast-breakdown.ts` / `ForecastBreakdownTable.tsx`).
 * `AddDealDialog.tsx`'s own local `CONFIDENCE_LEVEL_OPTIONS` and
 * `forecast-metrics.ts`'s private `CONFIDENCE_WEIGHT` map are intentionally
 * left untouched — out of this phase's boundary (05-CONTEXT.md
 * assumption_delta_decision: add-alongside, not promote).
 */

/** Fixed display order, descending confidence (D-08) — never derived from Object.keys(). */
export const CONFIDENCE_LEVELS: ConfidenceLevel[] = ["100", "80", "50", "open-to-rfp"];

/** Display labels — copied verbatim from AddDealDialog.tsx's CONFIDENCE_LEVEL_OPTIONS. */
export const CONFIDENCE_LEVEL_LABELS: Record<ConfidenceLevel, string> = {
  "100": "100%",
  "80": "80%",
  "50": "50%",
  "open-to-rfp": "Open to RFP Bids",
};
