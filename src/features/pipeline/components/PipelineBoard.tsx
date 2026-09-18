import { useMemo, useState } from "react";
import type { ColumnFiltersState, SortingState } from "@tanstack/react-table";
import { GROUPS, usePipelineGroups } from "@/features/pipeline/hooks/usePipelineGroups";
import { GroupSection } from "@/features/pipeline/components/GroupSection";
import { AddDealDialog } from "@/features/pipeline/components/AddDealDialog";
import { PipelineToolbar } from "@/features/pipeline/components/PipelineToolbar";
import { Button } from "@/components/ui/button";
import { usePipelineStore } from "@/features/pipeline/store/pipelineStore";
import type { PipelineGroup } from "@/shared/types/deal";

/**
 * The primary pipeline view: mounts all 5 pipeline-stage groups
 * simultaneously, each pre-partitioned by usePipelineGroups() (never
 * TanStack's getGroupedRowModel — see 01-RESEARCH.md Pattern 1). Replaces
 * the Plan 02 tracer render in App.tsx. Also owns the "Add Deal" button
 * (D-03: modal triggered by a button owned by the parent) and its
 * open/close state, passed down into AddDealDialog.
 */
export function PipelineBoard() {
  const groups = usePipelineGroups();
  const [isAddDealOpen, setIsAddDealOpen] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const deals = usePipelineStore((s) => s.deals);
  const ownerOptions = useMemo(() => [...new Set(deals.map((d) => d.owner))].sort(), [deals]);
  const [owner, setOwner] = useState("");
  const [closeDateMin, setCloseDateMin] = useState("");
  const [closeDateMax, setCloseDateMax] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [visibleGroups, setVisibleGroups] = useState<PipelineGroup[]>([...GROUPS]);

  const isCloseDateRangeValid = !(
    closeDateMin !== "" &&
    closeDateMax !== "" &&
    closeDateMin > closeDateMax
  );

  const columnFilters: ColumnFiltersState = useMemo(() => {
    const filters: ColumnFiltersState = [];
    if (owner) filters.push({ id: "owner", value: owner });
    if (isCloseDateRangeValid && (closeDateMin !== "" || closeDateMax !== "")) {
      filters.push({
        id: "closeDate",
        value: [
          closeDateMin === "" ? undefined : closeDateMin,
          closeDateMax === "" ? undefined : `${closeDateMax}T23:59:59`,
        ],
      });
    }
    return filters;
  }, [owner, closeDateMin, closeDateMax, isCloseDateRangeValid]);

  const groupsToRender = GROUPS.filter((g) => visibleGroups.includes(g));

  const handleClearFilters = () => {
    setGlobalFilter("");
    setOwner("");
    setCloseDateMin("");
    setCloseDateMax("");
    setSorting([]);
    setVisibleGroups([...GROUPS]);
  };

  return (
    <div className="mx-auto flex w-[95%] flex-col gap-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-lg font-semibold">Pipeline</h1>
        <Button onClick={() => setIsAddDealOpen(true)}>Add Deal</Button>
      </div>
      <PipelineToolbar
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        owner={owner}
        onOwnerChange={setOwner}
        ownerOptions={ownerOptions}
        closeDateMin={closeDateMin}
        onCloseDateMinChange={setCloseDateMin}
        closeDateMax={closeDateMax}
        onCloseDateMaxChange={setCloseDateMax}
        isCloseDateRangeValid={isCloseDateRangeValid}
        visibleGroups={visibleGroups}
        onVisibleGroupsChange={setVisibleGroups}
        onClearFilters={handleClearFilters}
      />
      {groupsToRender.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="font-heading text-sm font-semibold">No pipeline stages selected.</p>
          <p className="text-sm text-muted-foreground">Choose at least one stage above to see deals.</p>
        </div>
      ) : (
        groupsToRender.map((group) => (
          <GroupSection
            key={group}
            group={group}
            deals={groups[group]}
            globalFilter={globalFilter}
            columnFilters={columnFilters}
            sorting={sorting}
            onSortingChange={setSorting}
          />
        ))
      )}
      <AddDealDialog open={isAddDealOpen} onOpenChange={setIsAddDealOpen} />
    </div>
  );
}
