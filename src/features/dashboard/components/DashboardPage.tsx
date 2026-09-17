import { usePipelineStore } from "@/features/pipeline/store/pipelineStore";
import {
  computeWonUnits,
  computeMonthlyWonUnits,
  computeOwnerLeaderboard,
} from "@/features/dashboard/dashboard-metrics";
import { ANNUAL_UNIT_TARGET } from "@/features/dashboard/dashboard-config";
import { UnitTargetGauge } from "@/features/dashboard/components/UnitTargetGauge";
import { TargetVsActualChart } from "@/features/dashboard/components/TargetVsActualChart";
import { OwnerLeaderboard } from "@/features/dashboard/components/OwnerLeaderboard";

/**
 * The read-only Dashboard tab (DASH-01..DASH-05). Reads the store's full,
 * unfiltered `deals` array directly — never a Pipeline-tab-filtered subset
 * (this plan's data-integrity rule, mirrors `ForecastPage.tsx`'s hard rule:
 * Dashboard numbers must never silently reflect a forgotten search/filter).
 * 06-01 wired only Row 1's first widget end-to-end (UnitTargetGauge,
 * DASH-01) as the phase's tracer slice. 06-02 completes Row 1
 * (TargetVsActualChart, DASH-02) and starts Row 2 (OwnerLeaderboard,
 * DASH-03) — 06-03 adds the remaining widgets to this same shell without
 * any architectural change.
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
        <TargetVsActualChart data={computeMonthlyWonUnits(deals)} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <OwnerLeaderboard entries={computeOwnerLeaderboard(deals)} />
      </div>
    </div>
  );
}
