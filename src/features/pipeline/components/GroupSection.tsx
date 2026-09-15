import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Briefcase, CircleX, Handshake, Target, Trophy, UserPlus } from "lucide-react";
import type { ColumnFiltersState, OnChangeFn, SortingState } from "@tanstack/react-table";
import { DealTable } from "@/features/pipeline/components/DealTable";
import type { Deal, PipelineGroup } from "@/shared/types/deal";
import { cn } from "@/lib/utils";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/**
 * This project's own group palette/iconography — not monday.com's solid
 * flat-color status banners. Each group gets a soft tint + left accent bar
 * + its own icon, per PROJECT.md's "own visual identity, not a clone"
 * decision.
 */
const GROUP_META: Record<
  PipelineGroup,
  { label: string; icon: LucideIcon; accent: string; tint: string }
> = {
  prospect: {
    label: "Prospect",
    icon: UserPlus,
    accent: "border-l-indigo-400",
    tint: "bg-indigo-50/60 dark:bg-indigo-950/20",
  },
  lead: {
    label: "Lead",
    icon: Target,
    accent: "border-l-amber-400",
    tint: "bg-amber-50/60 dark:bg-amber-950/20",
  },
  opportunity: {
    label: "Opportunity",
    icon: Handshake,
    accent: "border-l-cyan-400",
    tint: "bg-cyan-50/60 dark:bg-cyan-950/20",
  },
  deal: {
    label: "Deal",
    icon: Briefcase,
    accent: "border-l-emerald-400",
    tint: "bg-emerald-50/60 dark:bg-emerald-950/20",
  },
  won: {
    label: "Contracts",
    icon: Trophy,
    accent: "border-l-yellow-400",
    tint: "bg-yellow-50/60 dark:bg-yellow-950/20",
  },
  lost: {
    label: "Lost",
    icon: CircleX,
    accent: "border-l-rose-400",
    tint: "bg-rose-50/60 dark:bg-rose-950/20",
  },
};

interface GroupSectionProps {
  group: PipelineGroup;
  deals: Deal[];
  globalFilter: string;
  columnFilters: ColumnFiltersState;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
}

/**
 * One pipeline-stage section: header (label, count, summed value) + its
 * DealTable. The header always renders, regardless of whether `deals` is
 * empty — a group never disappears just because it currently has 0 deals.
 */
export function GroupSection({
  group,
  deals,
  globalFilter,
  columnFilters,
  sorting,
  onSortingChange,
}: GroupSectionProps) {
  const meta = GROUP_META[group];
  const Icon = meta.icon;
  // Starts equal to `deals` and self-corrects one render tick after `deals`
  // itself changes (e.g. a new deal is added elsewhere) via DealTable's
  // effect firing — expected, not a regression.
  const [visibleDeals, setVisibleDeals] = useState<Deal[]>(deals);
  const total = visibleDeals.reduce((sum, d) => sum + d.value, 0);

  return (
    <section
      className={cn(
        "rounded-xl border border-border border-l-4 bg-card shadow-sm",
        meta.accent,
      )}
    >
      <header className={cn("flex items-center justify-between gap-4 rounded-t-xl px-4 py-3", meta.tint)}>
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-foreground/70" aria-hidden="true" />
          <h2 className="font-heading text-sm font-semibold tracking-wide">{meta.label}</h2>
          <span className="rounded-full bg-background/80 px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {visibleDeals.length}
          </span>
        </div>
        <span className="text-sm font-semibold text-foreground/80">
          {currencyFormatter.format(total)}
        </span>
      </header>
      <div className="p-3">
        <DealTable
          group={group}
          deals={deals}
          globalFilter={globalFilter}
          columnFilters={columnFilters}
          sorting={sorting}
          onSortingChange={onSortingChange}
          onVisibleRowsChange={setVisibleDeals}
        />
      </div>
    </section>
  );
}
