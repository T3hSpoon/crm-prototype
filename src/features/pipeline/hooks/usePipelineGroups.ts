import { useMemo } from "react";
import { usePipelineStore } from "@/features/pipeline/store/pipelineStore";
import type { Deal, PipelineGroup } from "@/shared/types/deal";
import { toPipelineGroup } from "@/shared/utils/pipeline-group";

/** Fixed display order for the 5 pipeline-stage groups (never derived, never reordered). */
export const GROUPS: PipelineGroup[] = ["prospect", "lead", "opportunity", "deal", "lost"];

/**
 * Selector hook: partitions the store's flat `deals` list into the 5 fixed
 * pipeline groups. All 5 keys are always present in the returned record,
 * even when a group currently has zero deals — see 01-RESEARCH.md
 * Architecture Patterns Pattern 1 (pre-partition, not `getGroupedRowModel`).
 *
 * Memoized on `deals` only, so it does not recompute on every render.
 */
export function usePipelineGroups(): Record<PipelineGroup, Deal[]> {
  const deals = usePipelineStore((s) => s.deals);

  return useMemo(() => {
    const byGroup = Object.fromEntries(GROUPS.map((g) => [g, [] as Deal[]])) as Record<
      PipelineGroup,
      Deal[]
    >;
    for (const deal of deals) {
      byGroup[toPipelineGroup(deal)].push(deal);
    }
    return byGroup;
  }, [deals]);
}
