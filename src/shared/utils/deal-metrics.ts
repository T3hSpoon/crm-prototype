import type { Deal } from "@/shared/types/deal";

/**
 * Pure, never-stored derived-value functions for a deal's billing/financial
 * metrics (Quick task 260910-fl6). Mirrors `line-items.ts`'s existing
 * derived-value module shape: no side effects, no store/repository imports.
 * MRR, ARR, Lifetime Contract Value, and ARPU are never stored fields on
 * `Deal` — they are always computed here at render time from `value`,
 * `frequency`, `contractTermMonths`, and `lineItems`, so they can never go
 * stale relative to those fields.
 */

/** Number of months in each billing frequency's period. */
const PERIOD_MONTHS: Record<Deal["frequency"], number> = {
  monthly: 1,
  quarterly: 3,
  quadrimestral: 4,
  "semi-annual": 6,
  annually: 12,
};

/** Monthly Recurring Revenue — value normalized to a monthly rate. */
export function computeMrr(deal: Pick<Deal, "value" | "frequency">): number {
  return deal.value / PERIOD_MONTHS[deal.frequency];
}

/** Annual Recurring Revenue — MRR x 12. */
export function computeArr(deal: Pick<Deal, "value" | "frequency">): number {
  return computeMrr(deal) * 12;
}

/** Lifetime Contract Value — MRR x the deal's contract term in months. */
export function computeLifetimeContractValue(
  deal: Pick<Deal, "value" | "frequency" | "contractTermMonths">,
): number {
  return computeMrr(deal) * deal.contractTermMonths;
}

/**
 * Average Revenue Per Unit — value divided by the total units across the
 * deal's line items. Returns `null` (never 0/NaN/Infinity) when the deal has
 * zero line items — there is no unit basis to divide by. Callers must branch
 * on `null` and render an empty-cell placeholder instead of a computed
 * number.
 */
export function computeArpu(deal: Pick<Deal, "value" | "lineItems">): number | null {
  const totalUnits = deal.lineItems.reduce((sum, item) => sum + item.units, 0);
  return totalUnits === 0 ? null : deal.value / totalUnits;
}
