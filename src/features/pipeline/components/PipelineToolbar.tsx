import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface PipelineToolbarProps {
  globalFilter: string;
  onGlobalFilterChange: (value: string) => void;
}

/**
 * Shared toolbar rendered once above all 6 pipeline-stage `GroupSection`s
 * (D-05). Task 1 wires only the search input; Task 2/3 widen this same
 * component's props with owner/value/close-date filters, sorting arrows'
 * source data, the group-visibility toggle, and "Clear filters" — never
 * renamed, never duplicated (04-RESEARCH.md Pattern 1: one shared toolbar).
 */
export function PipelineToolbar({ globalFilter, onGlobalFilterChange }: PipelineToolbarProps) {
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
    </div>
  );
}
