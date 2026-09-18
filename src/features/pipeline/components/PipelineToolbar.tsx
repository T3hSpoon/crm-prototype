import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { GROUPS } from "@/features/pipeline/hooks/usePipelineGroups";
import type { PipelineGroup } from "@/shared/types/deal";

// Radix's Select.Item forbids an empty-string `value` (it reserves "" to mean
// "clear selection back to placeholder" internally) — this sentinel stands in
// for "All owners" in the UI and is translated back to "" at the boundary.
const ALL_OWNERS_VALUE = "__all__";

const GROUP_LABELS: Record<PipelineGroup, string> = {
  prospect: "Prospect",
  lead: "Lead",
  opportunity: "Opportunity",
  deal: "Deal",
  won: "Won",
  lost: "Lost",
};

interface PipelineToolbarProps {
  globalFilter: string;
  onGlobalFilterChange: (value: string) => void;
  owner: string;
  onOwnerChange: (value: string) => void;
  ownerOptions: string[];
  closeDateMin: string;
  onCloseDateMinChange: (value: string) => void;
  closeDateMax: string;
  onCloseDateMaxChange: (value: string) => void;
  isCloseDateRangeValid: boolean;
  visibleGroups: PipelineGroup[];
  onVisibleGroupsChange: (groups: PipelineGroup[]) => void;
  onClearFilters: () => void;
}

/**
 * Shared toolbar rendered once above all 6 pipeline-stage `GroupSection`s
 * (D-05). Task 1 wires only the search input; Task 2/3 widen this same
 * component's props with owner/value/close-date filters, sorting arrows'
 * source data, the group-visibility toggle, and "Clear filters" — never
 * renamed, never duplicated (04-RESEARCH.md Pattern 1: one shared toolbar).
 */
export function PipelineToolbar({
  globalFilter,
  onGlobalFilterChange,
  owner,
  onOwnerChange,
  ownerOptions,
  closeDateMin,
  onCloseDateMinChange,
  closeDateMax,
  onCloseDateMaxChange,
  isCloseDateRangeValid,
  visibleGroups,
  onVisibleGroupsChange,
  onClearFilters,
}: PipelineToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
      <div className="relative flex items-center">
        <Search
          className="pointer-events-none absolute left-2.5 size-4 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          placeholder="Search by name or company..."
          value={globalFilter}
          onChange={(e) => onGlobalFilterChange(e.target.value)}
          className="max-w-xs pl-8"
        />
      </div>

      <Select
        value={owner === "" ? ALL_OWNERS_VALUE : owner}
        onValueChange={(value) => onOwnerChange(value === ALL_OWNERS_VALUE ? "" : value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="All owners" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_OWNERS_VALUE}>All owners</SelectItem>
          {ownerOptions.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <Input
            type="date"
            value={closeDateMin}
            onChange={(e) => onCloseDateMinChange(e.target.value)}
            className="w-36"
          />
          <Input
            type="date"
            value={closeDateMax}
            onChange={(e) => onCloseDateMaxChange(e.target.value)}
            className="w-36"
          />
        </div>
        {!isCloseDateRangeValid && (
          <p className="text-sm text-destructive">End date must be on or after the start date.</p>
        )}
      </div>

      <ToggleGroup
        type="multiple"
        value={visibleGroups}
        onValueChange={(next) => onVisibleGroupsChange(next as PipelineGroup[])}
      >
        {GROUPS.map((group) => (
          <ToggleGroupItem key={group} value={group} aria-label={GROUP_LABELS[group]}>
            {GROUP_LABELS[group]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <Button type="button" variant="ghost" size="sm" onClick={onClearFilters}>
        Clear filters
      </Button>
    </div>
  );
}
