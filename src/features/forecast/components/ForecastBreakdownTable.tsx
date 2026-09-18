import { Fragment } from "react";
import type { Deal } from "@/shared/types/deal";
import { CONFIDENCE_LEVELS, CONFIDENCE_LEVEL_LABELS } from "@/shared/constants/confidence-level";
import { groupDealsByConfidence, computeGroupTotals } from "@/features/forecast/forecast-breakdown";
import {
  computeQuantity,
  computeArpu,
  computeMrr,
  computeArr,
  computeLifetimeContractValue,
  joinModelSkus,
  joinServiceNames,
} from "@/shared/utils/deal-metrics";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** ARPU is a per-unit average, not a lump sum — keep 2 decimal places instead of rounding to a whole dollar. */
const arpuFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

interface ForecastBreakdownTableProps {
  deals: Deal[];
}

/**
 * Confidence-grouped financial breakdown table (Phase 5, FCST-03/FCST-04) —
 * every deal in the pipeline (open, won, lost) grouped by confidence level,
 * with per-deal financial columns, a subtotal row per group, and one
 * grand-total row as the table's final row. Plain HTML table, no
 * @tanstack/react-table involvement (D-11: always expanded, no
 * sort/filter/row-expand — RESEARCH.md's resolved recommendation). Mirrors
 * DealTable's overflow-x-auto shell and empty-state convention (GroupSection
 * precedent: a group never disappears just because it currently has 0
 * deals) — an empty group still renders its own $0/— subtotal row.
 */
export function ForecastBreakdownTable({ deals }: ForecastBreakdownTableProps) {
  const grouped = groupDealsByConfidence(deals);

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-max text-left text-sm">
        <thead className="bg-muted/50 text-muted-foreground">
          <tr>
            <th className="px-4 py-2 text-sm font-semibold">Account Name</th>
            <th className="px-4 py-2 text-sm font-semibold">Model</th>
            <th className="px-4 py-2 text-sm font-semibold">Services</th>
            <th className="px-4 py-2 text-sm font-semibold">Quantity</th>
            <th className="px-4 py-2 text-sm font-semibold">ARPU</th>
            <th className="px-4 py-2 text-sm font-semibold">MRR</th>
            <th className="px-4 py-2 text-sm font-semibold">ARR</th>
            <th className="px-4 py-2 text-sm font-semibold">LTV</th>
            <th className="px-4 py-2 text-sm font-semibold">Contract Length</th>
          </tr>
        </thead>
        <tbody>
          {CONFIDENCE_LEVELS.map((level) => {
            const groupDeals = grouped[level];
            const totals = computeGroupTotals(groupDeals);
            return (
              <Fragment key={level}>
                <tr className="bg-muted/30">
                  <td colSpan={9} className="px-4 py-2 text-xs font-semibold">
                    {CONFIDENCE_LEVEL_LABELS[level]}
                  </td>
                </tr>
                {groupDeals.length === 0 ? (
                  <tr className="border-t border-border">
                    <td colSpan={9} className="px-4 py-6 text-center text-muted-foreground">
                      No deals in this group yet.
                    </td>
                  </tr>
                ) : (
                  groupDeals.map((deal) => (
                    <tr key={deal.id} className="border-t border-border">
                      <td className="px-4 py-2">{deal.company}</td>
                      <td className="px-4 py-2">{joinModelSkus(deal) || "—"}</td>
                      <td className="px-4 py-2">{joinServiceNames(deal) || "—"}</td>
                      <td className="px-4 py-2">{computeQuantity(deal)}</td>
                      <td className="px-4 py-2">
                        {computeArpu(deal) === null
                          ? "—"
                          : arpuFormatter.format(computeArpu(deal) as number)}
                      </td>
                      <td className="px-4 py-2">{currencyFormatter.format(computeMrr(deal))}</td>
                      <td className="px-4 py-2">{currencyFormatter.format(computeArr(deal))}</td>
                      <td className="px-4 py-2">
                        {currencyFormatter.format(computeLifetimeContractValue(deal))}
                      </td>
                      <td className="px-4 py-2">{deal.contractTermMonths} mo</td>
                    </tr>
                  ))
                )}
                <tr className="border-t border-border bg-muted/30">
                  <td className="px-4 py-2 font-semibold">
                    {`Subtotal — ${CONFIDENCE_LEVEL_LABELS[level]}`}
                  </td>
                  <td className="px-4 py-2">—</td>
                  <td className="px-4 py-2">—</td>
                  <td className="px-4 py-2">{totals.quantity}</td>
                  <td className="px-4 py-2">
                    {totals.arpu === null ? "—" : arpuFormatter.format(totals.arpu)}
                  </td>
                  <td className="px-4 py-2">{currencyFormatter.format(totals.mrr)}</td>
                  <td className="px-4 py-2">{currencyFormatter.format(totals.arr)}</td>
                  <td className="px-4 py-2">
                    {currencyFormatter.format(totals.lifetimeContractValue)}
                  </td>
                  <td className="px-4 py-2">—</td>
                </tr>
              </Fragment>
            );
          })}
          {(() => {
            const grandTotals = computeGroupTotals(deals);
            return (
              <tr className="border-t border-border bg-muted/50">
                <td className="px-4 py-2 font-semibold">Grand Total</td>
                <td className="px-4 py-2">—</td>
                <td className="px-4 py-2">—</td>
                <td className="px-4 py-2">{grandTotals.quantity}</td>
                <td className="px-4 py-2">
                  {grandTotals.arpu === null ? "—" : arpuFormatter.format(grandTotals.arpu)}
                </td>
                <td className="px-4 py-2">{currencyFormatter.format(grandTotals.mrr)}</td>
                <td className="px-4 py-2">{currencyFormatter.format(grandTotals.arr)}</td>
                <td className="px-4 py-2">
                  {currencyFormatter.format(grandTotals.lifetimeContractValue)}
                </td>
                <td className="px-4 py-2">—</td>
              </tr>
            );
          })()}
        </tbody>
      </table>
    </div>
  );
}
