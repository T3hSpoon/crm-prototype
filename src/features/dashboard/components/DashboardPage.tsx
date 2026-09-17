import { usePipelineStore } from "@/features/pipeline/store/pipelineStore";
import { computeWonUnits } from "@/features/dashboard/dashboard-metrics";
import { ANNUAL_UNIT_TARGET } from "@/features/dashboard/dashboard-config";
import { UnitTargetGauge } from "@/features/dashboard/components/UnitTargetGauge";

/**
 * The read-only Dashboard tab (DASH-01..DASH-05). Reads the store's full,
 * unfiltered `deals` array directly — never a Pipeline-tab-filtered subset
 * (this plan's data-integrity rule, mirrors `ForecastPage.tsx`'s hard rule:
 * Dashboard numbers must never silently reflect a forgotten search/filter).
 * This plan (06-01) wires only Row 1's first widget end-to-end
 * (UnitTargetGauge, DASH-01) as the phase's tracer slice — 06-02/06-03 add
 * the remaining 4 widgets to this same shell without any architectural
 * change.
 */
export function DashboardPage() {
  const deals = usePipelineStore((s) => s.deals);
  const wonDeals = deals.filter((d) => d.outcome === "won");

  return (
    <div className="mx-auto flex w-[95%] flex-col gap-6 px-6 py-8">
      <h1 className="font-heading text-lg font-semibold">Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <UnitTargetGauge
          actual={computeWonUnits(deals)}
          target={ANNUAL_UNIT_TARGET}
          wonDealCount={wonDeals.length}
        />
      </div>
    </div>
  );
}
