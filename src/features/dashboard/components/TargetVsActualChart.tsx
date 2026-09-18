import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import type { computeMonthlyWonUnits } from "@/features/dashboard/dashboard-metrics";

interface TargetVsActualChartProps {
  data: ReturnType<typeof computeMonthlyWonUnits>;
}

/**
 * Target vs. Actual Sales chart (DASH-02) — 12 trailing monthly buckets of
 * Won-deal unit volume ("Actual") against each bucket's per-calendar-month
 * seeded unit target ("Target"), rendered as two overlaid (non-stacked)
 * Area series on ONE shared y-axis (units). Never a dual-axis composition —
 * both series are the same unit, so a shared axis is both the safer and the
 * more correct representation (RESEARCH.md anti-pattern: dual-axis charts
 * invent a correlation that isn't in the data). Card/CardContent + title +
 * empty-state shape mirrors `LostBreakdownChart.tsx` exactly.
 */
export function TargetVsActualChart({ data }: TargetVsActualChartProps) {
  const isEmpty = data.every((bucket) => bucket.actual === 0);

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold">Target vs. Actual Sales</h3>
        {isEmpty ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No closed-deal history yet — this chart fills in as Won deals accumulate month over month.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-lost-grid)" />
              <XAxis dataKey="month" tick={{ fill: "#898781", fontSize: 12 }} />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "#898781", fontSize: 12 }}
                label={{
                  value: "Units",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#898781",
                  fontSize: 12,
                }}
              />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="actual"
                name="Actual"
                stroke="var(--chart-gauge-fill)"
                fill="var(--chart-gauge-fill)"
                fillOpacity={0.35}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="target"
                name="Target"
                stroke="var(--chart-lost-grid)"
                fill="var(--chart-lost-grid)"
                fillOpacity={0.08}
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
