import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { usePipelineStore } from "@/features/pipeline/store/pipelineStore";
import {
  dealEditSchema,
  type DealEditFormInput,
  type DealEditFormValues,
} from "@/features/pipeline/components/deal-edit-schema";
import type { PipelineGroup } from "@/shared/types/deal";
import { toPipelineGroup } from "@/shared/utils/pipeline-group";

/** Same 5 labeled stage options StageSelect/AddDealDialog both use. */
const GROUP_LABELS: Record<PipelineGroup, string> = {
  prospect: "Prospect",
  lead: "Lead",
  opportunity: "Opportunity",
  deal: "Deal / Won",
  lost: "Lost",
};

/** Copywriting Contract "Error state" row, 02-UI-SPEC.md. */
const UPDATE_FAILED_MESSAGE = "Update failed — your change wasn't saved. Try again.";

type EditableField = keyof DealEditFormValues;

interface DealDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealId: string | null;
}

/**
 * Controlled Sheet-based deal detail drawer implementing D-01/D-03: opened
 * from a pipeline-table row click, showing the deal's full identity, with
 * auto-committing core-field edits on blur. A field commit handler must
 * never programmatically close the sheet — only the Sheet's own close
 * affordances (close button, overlay click, Escape) ever close it (D-03).
 *
 * Each of the four core fields (name, value, owner, closeDate) commits
 * independently on blur. A `pendingFields` set disables a field from
 * re-entry while its own commit is in flight (guards the carried-forward
 * Pitfall 5 double-submit gap); a rejected commit reverts that field to the
 * deal's last-known value and shows an inline "Update failed" banner.
 */
export function DealDetailDrawer({ open, onOpenChange, dealId }: DealDetailDrawerProps) {
  const deal = usePipelineStore((s) => s.deals.find((d) => d.id === dealId));
  const updateDeal = usePipelineStore((s) => s.updateDeal);
  const [pendingFields, setPendingFields] = useState<Set<EditableField>>(new Set());
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<EditableField, string>>>({});

  const form = useForm<DealEditFormInput, unknown, DealEditFormValues>({
    resolver: zodResolver(dealEditSchema),
    values: {
      name: deal?.name ?? "",
      value: deal?.value ?? 0,
      owner: deal?.owner ?? "",
      // Native <input type="date"> requires exactly "YYYY-MM-DD"; seed data
      // stores a full ISO datetime (faker's toISOString()), so slice to the
      // date portion — a no-op for already-date-only strings.
      closeDate: deal?.closeDate ? deal.closeDate.slice(0, 10) : "",
    },
  });

  const clearFieldError = (name: EditableField) => {
    setFieldErrors((prev) => {
      if (!(name in prev)) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const commitField = async (name: EditableField, value: DealEditFormValues[EditableField]) => {
    if (!dealId) return;
    setPendingFields((prev) => new Set(prev).add(name));
    try {
      await updateDeal(dealId, { [name]: value });
      clearFieldError(name);
    } catch {
      // Revert to the deal's last-known value, read fresh from the store —
      // the store's own state is the source of truth, not this local form.
      const fresh = usePipelineStore.getState().deals.find((d) => d.id === dealId);
      if (fresh) {
        const revertValue = name === "closeDate" ? fresh.closeDate.slice(0, 10) : fresh[name];
        form.setValue(name, revertValue as DealEditFormInput[EditableField]);
      }
      setFieldErrors((prev) => ({ ...prev, [name]: UPDATE_FAILED_MESSAGE }));
    } finally {
      setPendingFields((prev) => {
        const next = new Set(prev);
        next.delete(name);
        return next;
      });
    }
  };

  if (!deal || !dealId) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto" />
      </Sheet>
    );
  }

  const currentGroup = toPipelineGroup(deal);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="truncate" title={deal.name}>
            {deal.name}
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4 pb-4">
          <FieldGroup>
            <Field>
              <FieldLabel>Company</FieldLabel>
              <p className="text-sm text-foreground">{deal.company}</p>
            </Field>
            <Field>
              <FieldLabel>Stage</FieldLabel>
              <p className="text-sm text-foreground">{GROUP_LABELS[currentGroup]}</p>
            </Field>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    disabled={pendingFields.has("name")}
                    onChange={(e) => {
                      field.onChange(e);
                      clearFieldError("name");
                    }}
                    onBlur={() => {
                      field.onBlur();
                      if (!fieldState.invalid) void commitField("name", field.value);
                    }}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  {!fieldState.invalid && fieldErrors.name && (
                    <FieldError>{fieldErrors.name}</FieldError>
                  )}
                </Field>
              )}
            />
            <Controller
              name="value"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Value</FieldLabel>
                  <Input
                    {...field}
                    value={(field.value as string | number | undefined) ?? ""}
                    id={field.name}
                    type="number"
                    min={0}
                    step="any"
                    aria-invalid={fieldState.invalid}
                    disabled={pendingFields.has("value")}
                    onChange={(e) => {
                      field.onChange(e);
                      clearFieldError("value");
                    }}
                    onBlur={() => {
                      field.onBlur();
                      if (!fieldState.invalid) void commitField("value", Number(field.value));
                    }}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  {!fieldState.invalid && fieldErrors.value && (
                    <FieldError>{fieldErrors.value}</FieldError>
                  )}
                </Field>
              )}
            />
            <Controller
              name="owner"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Owner</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    disabled={pendingFields.has("owner")}
                    onChange={(e) => {
                      field.onChange(e);
                      clearFieldError("owner");
                    }}
                    onBlur={() => {
                      field.onBlur();
                      if (!fieldState.invalid) void commitField("owner", field.value);
                    }}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  {!fieldState.invalid && fieldErrors.owner && (
                    <FieldError>{fieldErrors.owner}</FieldError>
                  )}
                </Field>
              )}
            />
            <Controller
              name="closeDate"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Close Date</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="date"
                    aria-invalid={fieldState.invalid}
                    disabled={pendingFields.has("closeDate")}
                    onChange={(e) => {
                      field.onChange(e);
                      clearFieldError("closeDate");
                    }}
                    onBlur={() => {
                      field.onBlur();
                      if (!fieldState.invalid) void commitField("closeDate", field.value);
                    }}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  {!fieldState.invalid && fieldErrors.closeDate && (
                    <FieldError>{fieldErrors.closeDate}</FieldError>
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </div>
      </SheetContent>
    </Sheet>
  );
}
