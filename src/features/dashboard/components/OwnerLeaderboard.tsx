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
 * `LostBreakdownChart.tsx` exactly.
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
          <div className="flex flex-col gap-2 pt-2">
            {entries.map((entry, index) => (
              <div key={entry.owner} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-background/80 px-2 py-1 text-xs font-medium leading-none text-foreground">
                    {index + 1}
                  </span>
                  <span className="text-sm">{entry.owner}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold tabular-nums">
                    {currencyFormatter.format(entry.wonValue)}
                  </span>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    ({entry.wonCount} {entry.wonCount === 1 ? "contract" : "contracts"})
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
