import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent } from "@/components/ui/card";

interface LostBreakdownChartProps {
  title: string;
  counts: Record<string, number>;
}

function toChartData(counts: Record<string, number>) {
  return Object.entries(counts).map(([name, count]) => ({ name, count }));
}

/**
 * Single-series Recharts bar-chart wrapper for the lost-by-reason/lost-by-
 * stage breakdowns (FCST-02). Both fill/gridline colors are driven by CSS
 * custom properties (`var(--chart-lost-bar)` / `var(--chart-lost-grid)`),
 * which flip automatically under `.dark` — no theme-detection logic needed
 * here. Always a count, never a currency value — the Y-axis is explicitly
 * labeled to make that clear.
 */
export function LostBreakdownChart({ title, counts }: LostBreakdownChartProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold">{title}</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={toChartData(counts)}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-lost-grid)" />
            <XAxis dataKey="name" tick={{ fill: "#898781", fontSize: 12 }} />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "#898781", fontSize: 12 }}
              label={{ value: "Number of Lost Deals", angle: -90, position: "insideLeft", fill: "#898781", fontSize: 12 }}
            />
            <Tooltip />
            <Bar dataKey="count" fill="var(--chart-lost-bar)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
