import { eachMonthOfInterval, format, startOfMonth, subMonths } from "date-fns";
import type { Deal } from "@/shared/types/deal";
import { MONTHLY_UNIT_TARGET, OWNER_ROSTER, TRAILING_MONTHS } from "@/features/dashboard/dashboard-config";

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

/**
 * Sum of `units` across ALL line items of a single deal — the per-deal
 * building block reused by both `computeWonUnits` and
 * `computeMonthlyWonUnits`, so the "sum all line-item types" rule (Pitfall
 * 4/Assumption A1) lives in exactly one place, never re-implemented.
 */
function sumLineItemUnits(deal: Pick<Deal, "lineItems">): number {
  return deal.lineItems.reduce((sum, item) => sum + item.units, 0);
}

/**
 * Buckets Won-deal unit volume (all line-item types, via `sumLineItemUnits`)
 * by `contractSignedDate` month (D-04) into exactly `months` (default
 * `TRAILING_MONTHS`, 12) trailing months ending at the current month
 * (inclusive). Every bucket is pre-seeded at `actual: 0` and
 * `target: MONTHLY_UNIT_TARGET` BEFORE accumulation, so a month with zero
 * Won deals still appears as a real, explicit zero entry in the returned
 * array — it is never silently omitted (the load-bearing correction vs.
 * only emitting buckets that have data). Open/lost deals never contribute,
 * even if they carry a `closeDate` that happens to fall in-range — only
 * `outcome === "won"` deals are read, and only via `contractSignedDate`
 * (never `closeDate`, which has an unrelated, outcome-dependent meaning for
 * open/lost deals — see Pitfall 1 in RESEARCH.md).
 */
export function computeMonthlyWonUnits(deals: Deal[], months: number = TRAILING_MONTHS) {
  const now = new Date();
  const buckets = eachMonthOfInterval({
    start: subMonths(startOfMonth(now), months - 1),
    end: now,
  }).map((d) => ({
    key: format(d, "yyyy-MM"),
    month: format(d, "MMM yyyy"),
    actual: 0,
    target: MONTHLY_UNIT_TARGET,
  }));
  const byKey = new Map(buckets.map((b) => [b.key, b]));

  for (const deal of deals) {
    if (deal.outcome !== "won" || !deal.contractSignedDate) continue; // D-04
    const bucket = byKey.get(format(new Date(deal.contractSignedDate), "yyyy-MM"));
    if (bucket) bucket.actual += sumLineItemUnits(deal);
  }

  return buckets;
}

/**
 * Ranks every fixed `OWNER_ROSTER` name (D-01) by total Won-deal `value`,
 * descending. Every roster name is pre-seeded at `wonValue: 0` BEFORE
 * accumulation, so a rep with zero Won deals still appears as a real `$0`
 * row — never omitted (deviates from RESEARCH.md's raw Pattern 3 sample,
 * which only aggregated owners with >=1 Won deal; UI-SPEC's explicit
 * zero-one-many row requires all 5 always). Always returns exactly 5
 * entries, one per roster name, regardless of `deals`' contents.
 */
export function computeOwnerLeaderboard(deals: Deal[]) {
  const totals = new Map<string, number>(OWNER_ROSTER.map((owner) => [owner, 0]));

  for (const d of deals) {
    if (d.outcome !== "won") continue;
    totals.set(d.owner, (totals.get(d.owner) ?? 0) + d.value);
  }

  return [...totals.entries()]
    .map(([owner, wonValue]) => ({ owner, wonValue }))
    .sort((a, b) => b.wonValue - a.wonValue);
}
