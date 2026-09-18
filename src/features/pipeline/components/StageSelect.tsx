import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LostReasonDialog } from "@/features/pipeline/components/LostReasonDialog";
import { WonContractTermsDialog } from "@/features/pipeline/components/WonContractTermsDialog";
import { usePipelineStore } from "@/features/pipeline/store/pipelineStore";
import type { PipelineGroup } from "@/shared/types/deal";

/**
 * The 6 labeled stage options this dropdown offers. AddDealDialog's own
 * stage selector is out of this plan's scope and still lists only the
 * original 5 ("Deal / Won") — a new deal is never created directly as Won
 * this phase (03.1-RESEARCH.md Anti-Patterns).
 */
const GROUP_OPTIONS: { value: PipelineGroup; label: string }[] = [
  { value: "prospect", label: "Prospect" },
  { value: "lead", label: "Lead" },
  { value: "opportunity", label: "Opportunity" },
  { value: "deal", label: "Deal" },
  { value: "won", label: "Won" },
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
  const [pendingGroup, setPendingGroup] = useState<"lost" | "won" | null>(null);
  // A signed Contract (Won) is a closed-won record — it can still be listed
  // as Prospect/Lead/Opportunity/Deal via a reversal, but never moved
  // straight to Lost. Every other stage keeps the full option list.
  const groupOptions =
    currentGroup === "won" ? GROUP_OPTIONS.filter((o) => o.value !== "lost") : GROUP_OPTIONS;

  const handleValueChange = (group: PipelineGroup) => {
    if (group === "lost") {
      setPendingGroup("lost");
      return;
    }
    if (group === "won") {
      setPendingGroup("won");
      return;
    }
    void usePipelineStore.getState().moveStage(dealId, group);
  };

  return (
    // Stops the row's onRowClick (D-02/Pitfall 2) — Radix's SelectTrigger
    // does not stop propagation itself, and the row now opens the detail
    // drawer on click.
    <div onClick={(e) => e.stopPropagation()}>
      <Select value={currentGroup} onValueChange={handleValueChange}>
        <SelectTrigger size="sm" aria-label="Move deal to stage">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {groupOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {pendingGroup === "lost" && (
        <LostReasonDialog dealId={dealId} open onOpenChange={() => setPendingGroup(null)} />
      )}
      {pendingGroup === "won" && (
        <WonContractTermsDialog dealId={dealId} open onOpenChange={() => setPendingGroup(null)} />
      )}
    </div>
  );
}
