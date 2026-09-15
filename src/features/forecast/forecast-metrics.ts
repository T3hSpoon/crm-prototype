import type { Deal, ConfidenceLevel, PipelineStage } from "@/shared/types/deal";

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

/**
 * Groups lost deals by the `lostReason` category prefix (split on the first
 * ":") — never the raw "{category}: {note}" string and never the free-text
 * note portion itself as a chart category. A lost deal with no recorded
 * reason still counts, under an "Unknown" bucket, never silently dropped.
 */
export function computeLostByReason(deals: Deal[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const d of deals.filter((deal) => deal.outcome === "lost")) {
    const category = d.lostReason?.split(":")[0]?.trim() ?? "Unknown";
    counts[category] = (counts[category] ?? 0) + 1;
  }
  return counts;
}

/**
 * Groups lost deals by `pipelineStage` directly — never `toPipelineGroup`,
 * which would return "lost" and destroy the stage information a lost deal
 * retains (the stage it fell through from).
 */
export function computeLostByStage(deals: Deal[]): Record<PipelineStage, number> {
  const counts: Record<PipelineStage, number> = { prospect: 0, lead: 0, opportunity: 0, deal: 0 };
  for (const d of deals.filter((deal) => deal.outcome === "lost")) {
    counts[d.pipelineStage] += 1;
  }
  return counts;
}
