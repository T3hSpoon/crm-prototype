import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent } from "@/components/ui/card";

interface LostBreakdownChartProps {
  title: string;
  counts: Record<string, number>;
}

function toChartData(counts: Record<string, number>) {
  return Object.entries(counts).map(([name, count]) => ({ name, count }));
}

const TICK_TRUNCATE_LENGTH = 14;

/**
 * Truncates a category tick label longer than 14 characters to an ellipsis.
 * Recharts' default `Tooltip` reads the full, untruncated `name` straight
 * from the underlying data point, so only this axis-tick label needs
 * shortening — no separate wiring for the tooltip.
 */
function TruncatedTick(props: { x?: number; y?: number; payload?: { value: string } }) {
  const { x, y, payload } = props;
  const label = payload?.value ?? "";
  const truncated =
    label.length > TICK_TRUNCATE_LENGTH ? `${label.slice(0, TICK_TRUNCATE_LENGTH)}…` : label;
  return (
    <text x={x} y={(y ?? 0) + 12} textAnchor="middle" fill="var(--muted-foreground)" fontSize={12}>
      {truncated}
    </text>
  );
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
  const isEmpty = Object.keys(counts).length === 0;

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold">{title}</h3>
        {isEmpty ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No lost deals recorded yet — this chart fills in once a deal is marked Lost.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={toChartData(counts)}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-lost-grid)" />
              <XAxis dataKey="name" tick={<TruncatedTick />} />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                label={{ value: "Number of Lost Deals", angle: -90, position: "insideLeft", fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <Tooltip />
              <Bar dataKey="count" fill="var(--chart-lost-bar)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
