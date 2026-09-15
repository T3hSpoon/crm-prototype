import { Card, CardContent } from "@/components/ui/card";

interface StatTileProps {
  label: string;
  value: string;
  caption?: string;
}

/**
 * Purely presentational stat tile for the Forecast page (FCST-01). Callers
 * pre-format `value` (currency, percent, or "—") — this component owns only
 * layout/typography, never formatting logic (mirrors the derived-value-never-
 * stored convention: no computation happens here).
 */
export function StatTile({ label, value, caption }: StatTileProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-4">
        <span className="text-xs font-semibold text-muted-foreground">{label}</span>
        <span className="text-2xl font-semibold tabular-nums break-words">{value}</span>
        {caption && <span className="text-xs text-muted-foreground">{caption}</span>}
      </CardContent>
    </Card>
  );
}
