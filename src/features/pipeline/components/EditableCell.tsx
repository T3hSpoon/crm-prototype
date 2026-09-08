import { useState } from "react";
import { format, parseISO } from "date-fns";
import { usePipelineStore } from "@/features/pipeline/store/pipelineStore";
import { dealEditSchema } from "@/features/pipeline/components/deal-edit-schema";
import { UPDATE_FAILED_MESSAGE } from "@/features/pipeline/constants";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

type EditableColumnId = "name" | "value" | "owner" | "closeDate";

interface EditableCellProps {
  dealId: string;
  columnId: EditableColumnId;
  value: string | number;
}

/**
 * Native <input type="date"> requires exactly "YYYY-MM-DD"; seed data stores
 * a full ISO datetime (faker's toISOString()), so slice to the date portion
 * for editing — a no-op for already-date-only strings (matches
 * DealDetailDrawer's identical normalization).
 */
function toEditableValue(columnId: EditableColumnId, value: string | number): string {
  if (columnId === "closeDate") return String(value).slice(0, 10);
  return String(value);
}

/**
 * Click-to-edit-in-place table cell for the pipeline table's four editable
 * columns (DEAL-02). Its own click handlers stop propagation so entering
 * edit mode never also fires the row's onRowClick and opens the detail
 * drawer (D-02/Pitfall 2) — the same guard pattern as StageSelect.
 */
export function EditableCell({ dealId, columnId, value }: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(() => toEditableValue(columnId, value));
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayText =
    columnId === "value"
      ? currencyFormatter.format(Number(value))
      : columnId === "closeDate"
        ? // Defensively guard against an empty/invalid closeDate already in the
          // store (e.g. from an earlier bug or bad seed) — format() throws
          // RangeError on an Invalid Date, and there is no ErrorBoundary.
          value
          ? format(parseISO(String(value)), "MMM d, yyyy")
          : "—"
        : String(value);

  if (!isEditing) {
    return (
      <div>
        <span
          className="block cursor-text px-1 py-0.5"
          onClick={(e) => {
            e.stopPropagation();
            if (isPending) return;
            setDraft(toEditableValue(columnId, value));
            setIsEditing(true);
          }}
        >
          {displayText}
        </span>
        {error && <span className="block px-1 text-xs text-destructive">{error}</span>}
      </div>
    );
  }

  const lastCommitted = toEditableValue(columnId, value);

  const commit = async () => {
    setIsEditing(false);
    if (isPending || draft === lastCommitted) return;
    // Reuse the same per-field rule the drawer's dealEditSchema-backed form
    // uses (DEAL-02 boundary/empty) — reject and revert client-side, never
    // send an invalid draft to the store.
    const candidate = columnId === "value" ? Number(draft) : draft;
    const parsed = dealEditSchema.shape[columnId].safeParse(candidate);
    if (!parsed.success) {
      setDraft(lastCommitted);
      setError(parsed.error.issues[0]?.message ?? UPDATE_FAILED_MESSAGE);
      return;
    }
    setIsPending(true);
    try {
      await usePipelineStore.getState().updateDeal(dealId, {
        [columnId]: parsed.data,
      });
      setError(null);
    } catch {
      setDraft(lastCommitted);
      setError(UPDATE_FAILED_MESSAGE);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <input
      autoFocus
      className="w-full rounded border border-input bg-transparent px-1 py-0.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      value={draft}
      type={columnId === "value" ? "number" : columnId === "closeDate" ? "date" : "text"}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => void commit()}
      onKeyDown={(e) => {
        if (e.key === "Enter") void commit();
        if (e.key === "Escape") {
          setDraft(lastCommitted);
          setIsEditing(false);
        }
      }}
      onClick={(e) => e.stopPropagation()}
    />
  );
}
