import type { Deal } from "@/shared/types/deal";
import { computeSubtotal } from "@/shared/utils/line-items";

/**
 * Pure, never-stored derived-value functions for a deal's billing/financial
 * metrics (Quick task 260910-gpd, correcting 260910-fl6). Mirrors
 * `line-items.ts`'s existing derived-value module shape: no side effects, no
 * store/repository imports. MRR, ARR, and Lifetime Contract Value are never
 * stored fields on `Deal` — they are always computed here at render time
 * from each line item's `type` (product vs service), `units`, and
 * `unitPrice`, plus `contractTermMonths`, so they can never go stale relative
 * to those fields. `Deal.value`/`Deal.frequency` play no role in these
 * formulas (both fields remain on `Deal` for other purposes). MRR/ARR are no
 * longer rendered as pipeline-table columns (per later correction), but stay
 * exported here since the underlying calculations remain valid and may be
 * used again. ARPU (Phase 5, per PROJECT.md's locked "ARPU reintroduced as
 * MRR / service quantity (derived, never stored)" decision) is reintroduced
 * this phase as a derived function below — never a stored field on `Deal`.
 */

/**
 * Monthly Recurring Revenue — the sum of `units x unitPrice` across only the
 * deal's `type: "service"` line items. Product-type line items contribute $0
 * to MRR.
 */
export function computeMrr(deal: Pick<Deal, "lineItems">): number {
  return deal.lineItems
    .filter((item) => item.type === "service")
    .reduce((sum, item) => sum + computeSubtotal(item), 0);
}

/** Annual Recurring Revenue — MRR x 12. */
export function computeArr(deal: Pick<Deal, "lineItems">): number {
  return computeMrr(deal) * 12;
}

/**
 * Lifetime Contract Value — the sum of the deal's `type: "product"` line
 * items' subtotals (a one-time purchase total) plus MRR x the deal's
 * contract term in months (the recurring service revenue accrued over the
 * full term). Always a real number, never `null` — even when
 * `contractTermMonths` is 0, the product-purchase portion is still a
 * genuine, meaningful value (only the recurring-service addend becomes $0).
 */
export function computeLifetimeContractValue(
  deal: Pick<Deal, "lineItems" | "contractTermMonths">,
): number {
  const productSubtotal = deal.lineItems
    .filter((item) => item.type === "product")
    .reduce((sum, item) => sum + computeSubtotal(item), 0);
  return productSubtotal + computeMrr(deal) * deal.contractTermMonths;
}

/**
 * Quantity — the sum of `units` across only the deal's `type: "service"`
 * line items (Phase 5, FCST-03). Product-type line-item units are excluded,
 * mirroring `computeMrr`'s service-only filter.
 */
export function computeQuantity(deal: Pick<Deal, "lineItems">): number {
  return deal.lineItems
    .filter((item) => item.type === "service")
    .reduce((sum, item) => sum + item.units, 0);
}

/**
 * ARPU (Average Revenue Per User) — MRR / Quantity. Returns `null` (never
 * `0` or `NaN`) when Quantity is 0, since a deal with no service line items
 * has no meaningful per-unit average (D-06).
 */
export function computeArpu(deal: Pick<Deal, "lineItems">): number | null {
  const quantity = computeQuantity(deal);
  return quantity === 0 ? null : computeMrr(deal) / quantity;
}

/**
 * Comma-joins ALL of a deal's line-item SKUs (not scoped to service-type
 * only, D-04) — mirrors `joinServiceNames`'s own comma-join convention.
 * Blank skus are filtered out before joining so a missing sku never produces
 * a stray/double comma (Pitfall 4). Returns `""` when there is nothing to
 * join — callers render the em-dash fallback (D-05).
 */
export function joinModelSkus(deal: Pick<Deal, "lineItems">): string {
  return deal.lineItems
    .map((item) => item.sku)
    .filter(Boolean)
    .join(", ");
}

/**
 * Comma-joins `productOrService` of `type: "service"` line items only.
 * Blank values are filtered out before joining (Pitfall 4). Returns `""`
 * when there is nothing to join — callers render the em-dash fallback (D-05).
 */
export function joinServiceNames(deal: Pick<Deal, "lineItems">): string {
  return deal.lineItems
    .filter((item) => item.type === "service")
    .map((item) => item.productOrService)
    .filter(Boolean)
    .join(", ");
}
