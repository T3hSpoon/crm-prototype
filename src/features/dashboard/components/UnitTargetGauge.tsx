import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { computeUnitTargetPct } from "@/features/dashboard/dashboard-metrics";

interface UnitTargetGaugeProps {
  actual: number;
  target: number;
  /**
   * Distinct from `actual === 0` — a Won deal could legitimately sum to 0
   * units (e.g. an all-service deal with no unit-bearing line items), so
   * `wonDealCount` (not `actual`) is the emptiness signal (DASH-01 UI-SPEC
   * empty-state rule).
   */
  wonDealCount: number;
}

/**
 * Semicircle gauge showing Won-deal unit volume against the annual unit
 * target (DASH-01). `Card`/`CardContent`-wrapped, title/empty-state shape
 * mirrors `LostBreakdownChart.tsx` exactly.
 */
export function UnitTargetGauge({ actual, target, wonDealCount }: UnitTargetGaugeProps) {
  const isEmpty = wonDealCount === 0;
  const data = [{ name: "units", value: computeUnitTargetPct(actual, target) * 100 }];

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold">Unit Sales Target</h3>
        {isEmpty ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No Won deals yet — the gauge fills in once deals close.
          </p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <RadialBarChart
                data={data}
                startAngle={180}
                endAngle={0}
                innerRadius="70%"
                outerRadius="100%"
              >
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar
                  dataKey="value"
                  background={{ fill: "var(--chart-gauge-track)" }}
                  fill="var(--chart-gauge-fill)"
                  cornerRadius={0}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-semibold tabular-nums">
                {actual} / {target} units
              </span>
              <span className="text-xs text-muted-foreground">
                Annual Unit Target (trailing 12 months)
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
