import { GROUPS, usePipelineGroups } from "@/features/pipeline/hooks/usePipelineGroups";
import { GroupSection } from "@/features/pipeline/components/GroupSection";

/**
 * The primary pipeline view: mounts all 5 pipeline-stage groups
 * simultaneously, each pre-partitioned by usePipelineGroups() (never
 * TanStack's getGroupedRowModel — see 01-RESEARCH.md Pattern 1). Replaces
 * the Plan 02 tracer render in App.tsx.
 */
export function PipelineBoard() {
  const groups = usePipelineGroups();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-8">
      {GROUPS.map((group) => (
        <GroupSection key={group} group={group} deals={groups[group]} />
      ))}
    </div>
  );
}
