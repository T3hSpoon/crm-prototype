import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Radix's Select.Item forbids an empty-string `value` (it reserves "" to mean
// "clear selection back to placeholder" internally) — this sentinel stands in
// for "All owners" in the UI and is translated back to "" at the boundary.
const ALL_OWNERS_VALUE = "__all__";

interface PipelineToolbarProps {
  globalFilter: string;
  onGlobalFilterChange: (value: string) => void;
  owner: string;
  onOwnerChange: (value: string) => void;
  ownerOptions: string[];
  valueMin: string;
  onValueMinChange: (value: string) => void;
  valueMax: string;
  onValueMaxChange: (value: string) => void;
  closeDateMin: string;
  onCloseDateMinChange: (value: string) => void;
  closeDateMax: string;
  onCloseDateMaxChange: (value: string) => void;
  isValueRangeValid: boolean;
  isCloseDateRangeValid: boolean;
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
  valueMin,
  onValueMinChange,
  valueMax,
  onValueMaxChange,
  closeDateMin,
  onCloseDateMinChange,
  closeDateMax,
  onCloseDateMaxChange,
  isValueRangeValid,
  isCloseDateRangeValid,
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
            type="number"
            placeholder="Min value"
            value={valueMin}
            onChange={(e) => onValueMinChange(e.target.value)}
            className="w-28"
          />
          <Input
            type="number"
            placeholder="Max value"
            value={valueMax}
            onChange={(e) => onValueMaxChange(e.target.value)}
            className="w-28"
          />
        </div>
        {!isValueRangeValid && <p className="text-sm text-destructive">Enter a valid range.</p>}
      </div>

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
    </div>
  );
}
