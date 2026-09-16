import type { Deal, ConfidenceLevel } from "@/shared/types/deal";
import { CONFIDENCE_LEVELS } from "@/shared/constants/confidence-level";

/**
 * Pure, never-stored derived-value functions for the Forecast page's
 * confidence-grouped breakdown table (Phase 5, FCST-03/FCST-04). Mirrors
 * `forecast-metrics.ts`'s existing module shape: no side effects, no
 * store/repository import — every function here takes a `Deal[]` and
 * returns a plain computed value, unit-testable independent of Zustand.
 *
 * Deliberate contrast with `forecast-metrics.ts`'s `computeRawPipelineValue`/
 * `computeWeightedPipelineValue` (both `outcome === "open"`-only):
 * `groupDealsByConfidence` groups over the FULL, unfiltered `deals` array
 * with NO `outcome` filter, per PROJECT.md's locked "confidence-grouped
 * forecast table includes all deals regardless of outcome" decision.
 */

/**
 * Pre-partitions `deals` into the 4 fixed confidence-level buckets, in
 * `CONFIDENCE_LEVELS` order — all 4 keys are always present, even when a
 * bucket currently has zero deals (mirrors `usePipelineGroups`'s
 * pre-partition convention, but as a plain function with no hook/store
 * import). Includes deals of ANY outcome (open, won, lost) — see module
 * header.
 */
export function groupDealsByConfidence(deals: Deal[]): Record<ConfidenceLevel, Deal[]> {
  const byLevel = Object.fromEntries(CONFIDENCE_LEVELS.map((level) => [level, [] as Deal[]])) as Record<
    ConfidenceLevel,
    Deal[]
  >;
  for (const deal of deals) {
    byLevel[deal.confidenceLevel].push(deal);
  }
  return byLevel;
}
