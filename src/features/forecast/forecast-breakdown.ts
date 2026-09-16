import type { Deal, ConfidenceLevel } from "@/shared/types/deal";
import { CONFIDENCE_LEVELS } from "@/shared/constants/confidence-level";
import {
  computeQuantity,
  computeMrr,
  computeArr,
  computeLifetimeContractValue,
} from "@/shared/utils/deal-metrics";

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

/** Aggregated financial totals for a confidence group's subtotal row, or the whole-table grand-total row. */
export interface GroupTotals {
  quantity: number;
  mrr: number;
  arr: number;
  lifetimeContractValue: number;
  arpu: number | null;
}

/**
 * Sums quantity/mrr/arr/lifetimeContractValue across `deals` (FCST-04).
 * `arpu` derives from the AGGREGATE mrr/quantity — never an average of
 * per-deal ARPU values — and mirrors `forecast-metrics.ts`'s
 * `computeWinRate` divide-by-zero guard shape: `null` (never `0`/`NaN`) when
 * the aggregate quantity is 0 (D-06/D-07). Reused for both a group's
 * subtotal row (called with that group's own deals) and the whole-table
 * grand-total row (called with the full `deals` array) — one implementation,
 * not two (Pitfall 2).
 */
export function computeGroupTotals(deals: Deal[]): GroupTotals {
  const totals = deals.reduce(
    (acc, deal) => ({
      quantity: acc.quantity + computeQuantity(deal),
      mrr: acc.mrr + computeMrr(deal),
      arr: acc.arr + computeArr(deal),
      lifetimeContractValue: acc.lifetimeContractValue + computeLifetimeContractValue(deal),
    }),
    { quantity: 0, mrr: 0, arr: 0, lifetimeContractValue: 0 },
  );
  return {
    ...totals,
    arpu: totals.quantity === 0 ? null : totals.mrr / totals.quantity,
  };
}
