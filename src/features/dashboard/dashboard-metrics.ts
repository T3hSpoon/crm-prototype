import type { Deal } from "@/shared/types/deal";

/**
 * Pure, never-stored derived-value functions for the Dashboard page
 * (DASH-01..DASH-05). Mirrors `forecast-metrics.ts`'s existing module
 * shape: no side effects, no store/repository import — every function here
 * takes a `Deal[]` and returns a plain computed value, so it can be
 * unit-tested and reused independent of any Zustand selector or
 * Pipeline-tab toolbar state.
 */

/**
 * Sum of `units` across ALL line items (product AND service, not
 * service-only) of every deal with `outcome === "won"` (RESEARCH Pitfall
 * 4/Assumption A1) — intentionally distinct from
 * `deal-metrics.ts`'s `computeQuantity`, which sums only `type: "service"`
 * line-item units for a single deal's ARPU/MRR calculations. DASH-01/DASH-02
 * care about total shipped unit volume (hardware + service alike), not just
 * the recurring-revenue-relevant subset. Open/lost deals contribute 0; an
 * empty `deals` array returns 0. Addition is commutative, so the total does
 * not depend on the order of `deals` in the input array.
 */
export function computeWonUnits(deals: Deal[]): number {
  return deals
    .filter((d) => d.outcome === "won")
    .reduce(
      (sum, d) => sum + d.lineItems.reduce((itemSum, item) => itemSum + item.units, 0),
      0,
    );
}

/**
 * `actual / target`, clamped to the `[0, 1]` range — never overflows past
 * 100% and never divides by zero (mirrors `forecast-metrics.ts`'s
 * `computeWinRate` divide-by-zero guard pattern). Returns exactly `0` when
 * `target === 0` (no target set — nothing to measure against), exactly `1`
 * when `actual === target` or `actual > target` (a gauge/progress bar should
 * never render past a full ring), and `actual / target` otherwise.
 */
export function computeUnitTargetPct(actual: number, target: number): number {
  if (target === 0) return 0;
  return Math.min(actual / target, 1);
}
