import { Cell, Funnel, FunnelChart, LabelList, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import type { computeConversionFunnel } from "@/features/dashboard/dashboard-metrics";

interface ConversionFunnelChartProps {
  data: ReturnType<typeof computeConversionFunnel>;
  /**
   * Distinct from checking `data` itself — `computeConversionFunnel` always
   * returns 5 fixed-shape entries regardless of deal count, so `data.length`
   * can never signal emptiness. `hasDeals` (the store's raw deals array
   * non-empty check) is the real DASH-04 empty-state signal (UI-SPEC: "only
   * reachable if the store's deals array is empty").
   */
  hasDeals: boolean;
}

/**
 * Stage Conversion Rate funnel (DASH-04) — a cumulative CURRENT-STATE
 * snapshot of the pipeline, NOT a true historical stage-to-stage conversion
 * rate (RESEARCH.md Pitfall 2 — no stage-transition history exists in the
 * data model). The disclosure caption below the title renders unconditionally
 * (both empty and populated states) so this limitation is never silently
 * absorbed. Always renders exactly 5 fixed stages (Prospect through Won)
 * regardless of deal count — `computeConversionFunnel`'s fixed `stages`
 * array. Card/CardContent + title + empty-state shape mirrors
 * `LostBreakdownChart.tsx` exactly.
 */
export function ConversionFunnelChart({ data, hasDeals }: ConversionFunnelChartProps) {
  const isEmpty = !hasDeals;

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold">Conversion Rate</h3>
        <p className="text-xs text-muted-foreground">
          Current pipeline distribution — not a historical conversion rate.
        </p>
        {isEmpty ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No deals in the pipeline yet.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <FunnelChart>
              <Tooltip
                formatter={(_value, _name, item) => {
                  const point = item?.payload as { count: number; pct: number } | undefined;
                  return point ? `${point.count} deals (${Math.round(point.pct * 100)}%)` : "";
                }}
              />
              <Funnel dataKey="count" nameKey="stage" data={data} isAnimationActive>
                <LabelList position="right" dataKey="stage" fill="var(--muted-foreground)" stroke="none" />
                {data.map((entry, i) => (
                  <Cell key={entry.stage} fill={`var(--chart-funnel-${i + 1})`} />
                ))}
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
