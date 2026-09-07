import { useState } from "react";
import { GROUPS, usePipelineGroups } from "@/features/pipeline/hooks/usePipelineGroups";
import { GroupSection } from "@/features/pipeline/components/GroupSection";
import { AddDealDialog } from "@/features/pipeline/components/AddDealDialog";
import { Button } from "@/components/ui/button";

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

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-lg font-semibold">Pipeline</h1>
        <Button onClick={() => setIsAddDealOpen(true)}>Add Deal</Button>
      </div>
      {GROUPS.map((group) => (
        <GroupSection key={group} group={group} deals={groups[group]} />
      ))}
      <AddDealDialog open={isAddDealOpen} onOpenChange={setIsAddDealOpen} />
    </div>
  );
}
