import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import type { computeClosedByOwnerPerMonth } from "@/features/dashboard/dashboard-metrics";

interface ClosedByOwnerChartProps {
  data: ReturnType<typeof computeClosedByOwnerPerMonth>;
  owners: readonly string[];
  hasClosedDeals: boolean;
}

/**
 * Stacked bar of deals closed (won + lost) per period, segmented by owner
 * (DASH-05). One `<Bar stackId="closed">` per `owners` entry — the color
 * index always follows `owners`' fixed array position (OWNER_ROSTER order),
 * never a runtime-sorted index, so a given rep's color never changes
 * (RESEARCH.md anti-pattern, D-03). Month-axis ticks use `date-fns`
 * `format(d, "MMM yyyy")` (already baked into `data.month` by
 * `computeClosedByOwnerPerMonth`), short enough to never need truncation;
 * Recharts' default `Legend` wraps rather than clips a 5-entry legend.
 * Card/CardContent + title + empty-state shape mirrors
 * `LostBreakdownChart.tsx` exactly.
 */
export function ClosedByOwnerChart({ data, owners, hasClosedDeals }: ClosedByOwnerChartProps) {
  const isEmpty = !hasClosedDeals;

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold">Closed Deals by Owner</h3>
        {isEmpty ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No closed deals yet — this chart fills in as deals are won or lost.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-lost-grid)" />
              <XAxis dataKey="month" tick={{ fill: "#898781", fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fill: "#898781", fontSize: 12 }} />
              <Tooltip />
              <Legend />
              {owners.map((owner, i) => (
                <Bar key={owner} dataKey={owner} name={owner} stackId="closed" fill={`var(--chart-owner-${i + 1})`} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
