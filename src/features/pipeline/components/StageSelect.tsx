import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { LostReasonPopover } from "@/features/pipeline/components/LostReasonPopover";
import { usePipelineStore } from "@/features/pipeline/store/pipelineStore";
import type { PipelineGroup } from "@/shared/types/deal";

/** Same 5 labeled stage options AddDealDialog's stage selector uses. */
const GROUP_OPTIONS: { value: PipelineGroup; label: string }[] = [
  { value: "prospect", label: "Prospect" },
  { value: "lead", label: "Lead" },
  { value: "opportunity", label: "Opportunity" },
  { value: "deal", label: "Deal / Won" },
  { value: "lost", label: "Lost" },
];

interface StageSelectProps {
  dealId: string;
  currentGroup: PipelineGroup;
}

/**
 * Per-row stage-move control (01-RESEARCH.md Pattern 3 — the "ship the
 * simpler mechanism first" path per 01-CONTEXT.md's Claude's Discretion).
 * Picking a new option calls the existing moveStage store action directly;
 * no drag-and-drop library wiring this phase (reserved for a same-action
 * Phase 2+ fast-follow using the classic dnd-kit packages already installed).
 */
export function StageSelect({ dealId, currentGroup }: StageSelectProps) {
  const [pendingGroup, setPendingGroup] = useState<"lost" | null>(null);

  const handleValueChange = (group: PipelineGroup) => {
    if (group === "lost") {
      setPendingGroup("lost");
      return;
    }
    void usePipelineStore.getState().moveStage(dealId, group);
  };

  return (
    // Stops the row's onRowClick (D-02/Pitfall 2) — Radix's SelectTrigger
    // does not stop propagation itself, and the row now opens the detail
    // drawer on click.
    <div onClick={(e) => e.stopPropagation()}>
      <Popover
        open={pendingGroup === "lost"}
        onOpenChange={(open) => {
          // Escape/click-away dismissal (D-04) — clears local state only,
          // never calls a store action. `Select`'s value stays bound to
          // currentGroup, so it reverts automatically.
          if (!open) setPendingGroup(null);
        }}
      >
        <PopoverAnchor asChild>
          <div>
            <Select value={currentGroup} onValueChange={handleValueChange}>
              <SelectTrigger size="sm" aria-label="Move deal to stage">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GROUP_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </PopoverAnchor>
        <PopoverContent>
          {pendingGroup === "lost" && (
            <LostReasonPopover dealId={dealId} onClose={() => setPendingGroup(null)} />
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
