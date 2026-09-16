import { Fragment } from "react";
import type { Deal } from "@/shared/types/deal";
import { CONFIDENCE_LEVELS, CONFIDENCE_LEVEL_LABELS } from "@/shared/constants/confidence-level";
import { groupDealsByConfidence } from "@/features/forecast/forecast-breakdown";
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

interface ForecastBreakdownTableProps {
  deals: Deal[];
}

/**
 * Confidence-grouped financial breakdown table (Phase 5, FCST-03) — every
 * deal in the pipeline (open, won, lost) grouped by confidence level, with
 * per-deal financial columns. Plain HTML table, no @tanstack/react-table
 * involvement (D-11: always expanded, no sort/filter/row-expand —
 * RESEARCH.md's resolved recommendation). Mirrors DealTable's
 * overflow-x-auto shell and empty-state convention (GroupSection precedent:
 * a group never disappears just because it currently has 0 deals).
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
            <th className="px-4 py-2 text-sm font-semibold">Lifetime Contract Value</th>
            <th className="px-4 py-2 text-sm font-semibold">Contract Length</th>
          </tr>
        </thead>
        <tbody>
          {CONFIDENCE_LEVELS.map((level) => {
            const groupDeals = grouped[level];
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
                          : currencyFormatter.format(computeArpu(deal) as number)}
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
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
