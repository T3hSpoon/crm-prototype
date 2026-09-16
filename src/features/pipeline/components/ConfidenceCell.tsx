import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePipelineStore } from "@/features/pipeline/store/pipelineStore";
import { dealEditSchema } from "@/features/pipeline/components/deal-edit-schema";
import { UPDATE_FAILED_MESSAGE } from "@/features/pipeline/constants";
import { CONFIDENCE_LEVELS, CONFIDENCE_LEVEL_LABELS } from "@/shared/constants/confidence-level";
import type { ConfidenceLevel } from "@/shared/types/deal";

interface ConfidenceCellProps {
  dealId: string;
  value: ConfidenceLevel;
}

/**
 * Click-to-edit Confidence cell (DEAL-07) — a sibling to `EditableCell`, not
 * a variant of it (05-CONTEXT.md D-02/Discretion: keeps EditableCell's
 * existing 4-column EditableColumnId union simple). Mirrors EditableCell's
 * isEditing/isPending/error state machine and StageSelect's shadcn Select +
 * stopPropagation pattern, but swaps StageSelect's controlled-open Popover
 * gate for the Select's own open-change callback below — the mechanism that
 * collapses this cell back to its plain display span on Escape/click-away,
 * since a Select (unlike an <input>) has no native blur-to-revert behavior
 * of its own.
 */
export function ConfidenceCell({ dealId, value }: ConfidenceCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isEditing) {
    return (
      <div>
        <span
          className="block cursor-text px-1 py-0.5"
          onClick={(e) => {
            e.stopPropagation();
            if (isPending) return;
            setIsEditing(true);
          }}
        >
          {CONFIDENCE_LEVEL_LABELS[value]}
        </span>
        {error && <span className="block px-1 text-xs text-destructive">{error}</span>}
      </div>
    );
  }

  const commit = async (next: string) => {
    setIsEditing(false);
    if (next === value) return;
    const parsed = dealEditSchema.shape.confidenceLevel.safeParse(next);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? UPDATE_FAILED_MESSAGE);
      return;
    }
    setIsPending(true);
    try {
      await usePipelineStore.getState().updateDeal(dealId, { confidenceLevel: parsed.data });
      setError(null);
    } catch {
      setError(UPDATE_FAILED_MESSAGE);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Select
        value={value}
        onValueChange={(next) => void commit(next)}
        onOpenChange={(open) => {
          if (!open) setIsEditing(false);
        }}
      >
        <SelectTrigger size="sm" aria-label="Edit confidence level">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CONFIDENCE_LEVELS.map((level) => (
            <SelectItem key={level} value={level}>
              {CONFIDENCE_LEVEL_LABELS[level]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
