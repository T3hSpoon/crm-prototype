import { usePipelineStore } from "@/features/pipeline/store/pipelineStore";
import { computeRawPipelineValue, computeWeightedPipelineValue, computeWinRate } from "@/features/forecast/forecast-metrics";
import { StatTile } from "@/features/forecast/components/StatTile";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/**
 * The read-only Forecast tab (FCST-01/FCST-02). Reads the store's full,
 * unfiltered `deals` array directly — never a Pipeline-tab-filtered subset
 * (this plan's data-integrity prohibition: Forecast numbers must never
 * silently reflect a forgotten search/filter). No write actions exist here
 * (D-03).
 */
export function ForecastPage() {
  const deals = usePipelineStore((s) => s.deals);

  const raw = computeRawPipelineValue(deals);
  const weighted = computeWeightedPipelineValue(deals);
  const won = deals.filter((d) => d.outcome === "won").length;
  const lost = deals.filter((d) => d.outcome === "lost").length;
  const winRate = computeWinRate(deals);

  return (
    <div className="mx-auto flex w-[95%] flex-col gap-6 px-6 py-8">
      <h1 className="font-heading text-lg font-semibold">Forecast</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Raw Pipeline Value" value={currencyFormatter.format(raw)} />
        <StatTile label="Weighted Value" value={currencyFormatter.format(weighted)} />
        <StatTile
          label="Win Rate"
          value={won + lost === 0 ? "—" : `${Math.round(winRate * 100)}%`}
          caption={won + lost === 0 ? "No closed deals yet." : undefined}
        />
      </div>
    </div>
  );
}
