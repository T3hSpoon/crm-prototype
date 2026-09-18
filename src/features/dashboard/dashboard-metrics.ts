import { eachMonthOfInterval, format, parseISO, startOfMonth, subMonths } from "date-fns";
import type { Deal, PipelineStage } from "@/shared/types/deal";
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
    // `parseISO` (not `new Date`) — `contractSignedDate` is a date-only ISO string
    // (no time/offset), which `new Date` parses as UTC midnight while `format` reads
    // calendar fields in the local timezone, misattributing the 1st of a month into
    // the previous month's bucket for negative-UTC-offset viewers. `parseISO` reads
    // a date-only string as local midnight instead, matching `format`'s own frame.
    const bucket = byKey.get(format(parseISO(deal.contractSignedDate), "yyyy-MM"));
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
    // `owner` is free text everywhere else in the app (AddDealDialog, EditableCell) —
    // OWNER_ROSTER is not enforced on write, so a deal can carry an owner name
    // outside the fixed roster. Skip it here rather than inserting a 6th (or Nth)
    // leaderboard row, which would violate the "always exactly 5 entries" invariant
    // every consumer/test relies on.
    if (!totals.has(d.owner)) continue;
    totals.set(d.owner, (totals.get(d.owner) ?? 0) + d.value);
  }

  return [...totals.entries()]
    .map(([owner, wonValue]) => ({ owner, wonValue }))
    .sort((a, b) => b.wonValue - a.wonValue);
}

/** Fixed funnel ordering — matches PROJECT.md's locked pipeline order (`deal.ts`'s `PipelineStage`). */
const STAGE_ORDER: PipelineStage[] = ["prospect", "lead", "opportunity", "deal"];

/** Display labels for `computeConversionFunnel`'s returned `stage` strings, keyed by the same internal stage id plus the synthetic "won" entry. */
const STAGE_LABELS: Record<PipelineStage | "won", string> = {
  prospect: "Prospect",
  lead: "Lead",
  opportunity: "Opportunity",
  deal: "Deal",
  won: "Won",
};

/**
 * Cumulative "reached-at-least-this-stage" SNAPSHOT funnel (DASH-04) — NOT a
 * true historical stage-to-stage conversion rate. The data model stores only
 * a deal's *current* `pipelineStage`, not a log of stage transitions
 * (RESEARCH.md Pitfall 2), so a real cohort/advancement percentage cannot be
 * computed from it. This instead answers "of all deals ever created, what
 * fraction currently sits at or beyond stage N" — the standard fallback for
 * CRM dashboards lacking a stage-history log. UI copy must disclose this
 * (see ConversionFunnelChart's fixed caption), never present it as a true
 * conversion rate.
 *
 * Returns one entry per `STAGE_ORDER` stage plus a final "won" entry, each
 * `{ stage, count, pct }`. A deal counts toward a given non-won stage when
 * `outcome === "won"` (unconditionally — a completed deal is treated as
 * having passed every stage, RESEARCH Assumption A4, since `StageSelect`
 * allows a direct Prospect->Won move that would otherwise under-count) OR
 * when its `pipelineStage` rank is at/past that stage (covers open deals at
 * their current stage, and Lost deals, which retain the `pipelineStage` they
 * fell from — `pipeline-group.ts`'s established invariant). The "won" entry's
 * count is simply the number of `outcome === "won"` deals.
 *
 * `pct` is intentionally a raw, unrounded fraction (`count / total`) — never
 * pre-rounded here. Rounding happens only at the display layer via
 * `Math.round(pct * 100)`, matching `forecast-metrics.ts`'s `computeWinRate`
 * / `ForecastPage.tsx`'s existing `Math.round(winRate * 100)` convention.
 * `total = deals.length`; with 0 total deals every `pct` is exactly `0`
 * (divide-by-zero guarded, never `NaN`/`Infinity`).
 */
export function computeConversionFunnel(deals: Deal[]) {
  const total = deals.length;
  const stages: (PipelineStage | "won")[] = [...STAGE_ORDER, "won"];

  return stages.map((stage) => {
    const count =
      stage === "won"
        ? deals.filter((d) => d.outcome === "won").length
        : deals.filter((d) => {
            if (d.outcome === "won") return true; // completed deals reached every stage
            return STAGE_ORDER.indexOf(d.pipelineStage) >= STAGE_ORDER.indexOf(stage);
          }).length;
    return { stage: STAGE_LABELS[stage], count, pct: total === 0 ? 0 : count / total };
  });
}

/**
 * Buckets deals CLOSED (won + lost — RESEARCH Assumption A3's broader
 * "closed" reading, consistent with `forecast-metrics.ts`'s existing
 * `computeWinRate` treating won+lost as closed) per month, segmented by
 * owner (DASH-05), summing each deal's `value` (not a raw deal count) into
 * its owner/month cell. Pre-seeds all `months` (default `TRAILING_MONTHS`,
 * 12) month buckets x all `owners` (default `OWNER_ROSTER`, 5) at `0` BEFORE
 * accumulating, so a sparse owner/month combination still renders as a real
 * zero segment, never silently skipped (UI-SPEC "partial" backstop).
 *
 * A Won deal is bucketed by `contractSignedDate` (D-04); a Lost deal is
 * bucketed by `closeDate` (D-05) — never the other way around, since
 * `closeDate`'s meaning is outcome-dependent (RESEARCH Pitfall 1: forward-
 * looking "expected close" for open deals vs. "when it actually closed" for
 * lost deals). Open deals never contribute.
 */
export function computeClosedByOwnerPerMonth(
  deals: Deal[],
  owners: readonly string[] = OWNER_ROSTER,
  months: number = TRAILING_MONTHS,
) {
  const now = new Date();
  const buckets = eachMonthOfInterval({
    start: subMonths(startOfMonth(now), months - 1),
    end: now,
  }).map((d) => {
    const row: Record<string, string | number> = {
      key: format(d, "yyyy-MM"),
      month: format(d, "MMM yyyy"),
    };
    for (const owner of owners) row[owner] = 0;
    return row;
  });
  const byKey = new Map(buckets.map((b) => [b.key as string, b]));

  for (const deal of deals) {
    if (deal.outcome !== "won" && deal.outcome !== "lost") continue; // RESEARCH Assumption A3
    const dateStr = deal.outcome === "won" ? deal.contractSignedDate : deal.closeDate; // D-04/D-05
    if (!dateStr) continue;
    // `owner` is free text everywhere else in the app (AddDealDialog, EditableCell) —
    // `owners` (the fixed roster) is not enforced on write. Without this guard, an
    // unrecognized owner would either leak a stray property no `<Bar dataKey>` ever
    // renders (silently dropping the deal from the chart) or, if the free-text name
    // collides with "key"/"month", corrupt this row's own bookkeeping fields.
    if (!owners.includes(deal.owner)) continue;
    // `parseISO` (not `new Date`) — for Won deals `dateStr` is `contractSignedDate`,
    // a date-only ISO string that `new Date` parses as UTC midnight, misattributing
    // it to the previous month's local bucket (see computeMonthlyWonUnits). Lost
    // deals' `closeDate` is a full ISO datetime; `parseISO` parses that identically
    // to `new Date`, so this is a safe uniform fix for both branches.
    const bucket = byKey.get(format(parseISO(dateStr), "yyyy-MM"));
    if (bucket) bucket[deal.owner] = (Number(bucket[deal.owner]) || 0) + deal.value;
  }

  return buckets;
}
