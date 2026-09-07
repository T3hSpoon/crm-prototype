import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const handleValueChange = (group: PipelineGroup) => {
    void usePipelineStore.getState().moveStage(dealId, group);
  };

  return (
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
  );
}
