import { Card, CardContent } from "@/components/ui/card";
import type { computeOwnerLeaderboard } from "@/features/dashboard/dashboard-metrics";

interface OwnerLeaderboardProps {
  entries: ReturnType<typeof computeOwnerLeaderboard>;
}

/**
 * Matches `ForecastPage.tsx`'s exact currency formatter config, so
 * leaderboard values read identically to the rest of the app's
 * currency-formatted figures.
 */
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/**
 * Owner Leaderboard (DASH-03) — up to 5 fixed-roster rows ranked by total
 * Won-deal value, descending. All rows use a single hue for the rank badge
 * and value text — never a per-owner color — since this is a magnitude
 * comparison of one series, not an identity display (RESEARCH.md
 * anti-pattern). Card/CardContent + title + empty-state shape mirrors
 * `LostBreakdownChart.tsx` exactly. Table markup (plain `<table>`, no
 * @tanstack/react-table — always-expanded, no sort/filter/row-expand)
 * mirrors `ForecastBreakdownTable.tsx`'s convention.
 */
export function OwnerLeaderboard({ entries }: OwnerLeaderboardProps) {
  const isEmpty = entries.every((e) => e.wonValue === 0);

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold">Owner Leaderboard</h3>
        {isEmpty ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No Won deals yet — the leaderboard fills in once deals close.
          </p>
        ) : (
          <div className="mt-2 overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-max text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-sm font-semibold">Rank</th>
                  <th className="px-4 py-2 text-sm font-semibold">Owner</th>
                  <th className="px-4 py-2 text-sm font-semibold">Value</th>
                  <th className="px-4 py-2 text-sm font-semibold">Contracts</th>
                  <th className="px-4 py-2 text-sm font-semibold">LTV</th>
                  <th className="px-4 py-2 text-sm font-semibold">ARPU</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => (
                  <tr key={entry.owner} className="border-t border-border">
                    <td className="px-4 py-2">
                      <span className="rounded-full bg-background/80 px-2 py-1 text-xs font-medium leading-none text-foreground">
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-2">{entry.owner}</td>
                    <td className="px-4 py-2 font-semibold tabular-nums">
                      {currencyFormatter.format(entry.wonValue)}
                    </td>
                    <td className="px-4 py-2 tabular-nums">{entry.wonCount}</td>
                    <td className="px-4 py-2 tabular-nums">{currencyFormatter.format(entry.ltv)}</td>
                    <td className="px-4 py-2 tabular-nums">
                      {entry.arpu === null ? "—" : currencyFormatter.format(entry.arpu)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
