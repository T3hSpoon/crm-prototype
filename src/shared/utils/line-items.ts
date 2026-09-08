import type { Deal, LineItem } from "@/shared/types/deal";

/**
 * Pure, never-stored derived-value functions for a deal's line-item
 * composition (DEAL-04/DEAL-05). Mirrors `pipeline-group.ts`'s existing
 * derived-value module shape: no side effects, no store/repository imports.
 * Neither `LineItem.subtotal` nor `Deal.total`/`computedValue` is ever a
 * stored field — every total is computed here at render/commit time.
 */

/** A single row's subtotal — never rounded before summation (DEAL-04 precision). */
export function computeSubtotal(item: Pick<LineItem, "units" | "unitPrice">): number {
  return item.units * item.unitPrice;
}

/**
 * Sum of every line item's subtotal. Addition is commutative, so this does
 * not depend on line-item order (DEAL-05 ordering). Every row is summed
 * independently regardless of whether two rows are content-identical — no
 * merge/dedup occurs (DEAL-05 adjacency).
 */
export function sumLineItems(lineItems: LineItem[]): number {
  return lineItems.reduce((sum, item) => sum + computeSubtotal(item), 0);
}

/**
 * Rounds to the nearest cent. Used only when comparing a deal's value
 * against its computed line-item sum, to avoid float-precision false
 * positives incorrectly flagging a fresh, untouched deal as manually
 * overridden (DEAL-05 precision) — per-row display rounding stays the
 * currency formatter's job.
 */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Whether a deal's `value` has diverged from its computed line-item sum —
 * the only signal (no separate stored flag) that a total was manually set
 * rather than auto-computed. With zero line items, returns `false`
 * unconditionally before any comparison runs (DEAL-05 empty).
 */
export function hasManualOverride(deal: Pick<Deal, "value" | "lineItems">): boolean {
  if (deal.lineItems.length === 0) return false;
  return round2(deal.value) !== round2(sumLineItems(deal.lineItems));
}
