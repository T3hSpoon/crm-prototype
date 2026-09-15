import type { Deal, ConfidenceLevel } from "@/shared/types/deal";

/**
 * Pure, never-stored derived-value functions for the Forecast page
 * (FCST-01/FCST-02). Mirrors `deal-metrics.ts`'s existing module shape: no
 * side effects, no store/repository import — every function here takes a
 * `Deal[]` and returns a plain computed value, so it can be unit-tested and
 * reused independent of any Zustand selector or Pipeline-tab toolbar state.
 */

/**
 * Locked Confidence Level -> weight mapping (STATE.md, Phase 4 pre-decision):
 * 100% -> 1.0, 80% -> 0.8, 50% -> 0.5, Open to RFP Bids -> 0.0 (conservative,
 * contributes $0 until a real percentage is assigned).
 */
const CONFIDENCE_WEIGHT: Record<ConfidenceLevel, number> = {
  "100": 1.0,
  "80": 0.8,
  "50": 0.5,
  "open-to-rfp": 0.0,
};

/**
 * Sum of `value` across open deals only (`outcome === "open"`) — Won and
 * Lost deals are excluded (D-08).
 */
export function computeRawPipelineValue(deals: Deal[]): number {
  return deals.filter((d) => d.outcome === "open").reduce((sum, d) => sum + d.value, 0);
}

/**
 * Sum of `value * confidence weight` over the same open-deals scope, using
 * the locked Confidence Level mapping (D-09).
 */
export function computeWeightedPipelineValue(deals: Deal[]): number {
  return deals
    .filter((d) => d.outcome === "open")
    .reduce((sum, d) => sum + d.value * CONFIDENCE_WEIGHT[d.confidenceLevel], 0);
}

/**
 * won / (won + lost), counting only deals that reached a terminal outcome;
 * still-open deals are excluded from both numerator and denominator. Guards
 * the divide-by-zero case (D-10) by returning 0 when no deal has reached a
 * terminal outcome yet — callers render "—" / "No closed deals yet." in that
 * case rather than treating 0 as a real 0% win rate.
 */
export function computeWinRate(deals: Deal[]): number {
  const won = deals.filter((d) => d.outcome === "won").length;
  const lost = deals.filter((d) => d.outcome === "lost").length;
  return won + lost === 0 ? 0 : won / (won + lost);
}
