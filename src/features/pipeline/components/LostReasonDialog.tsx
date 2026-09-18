import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePipelineStore } from "@/features/pipeline/store/pipelineStore";
import { lostReasonSchema, type LostReasonFormValues } from "@/features/pipeline/components/lost-reason-schema";
import { UPDATE_FAILED_MESSAGE } from "@/features/pipeline/constants";

/** Fixed 5-option Reason list, verbatim (D-03). */
const REASON_OPTIONS: { value: LostReasonFormValues["category"]; label: string }[] = [
  { value: "Price", label: "Price" },
  { value: "Timing", label: "Timing" },
  { value: "Competitor", label: "Competitor" },
  { value: "No Budget", label: "No Budget" },
  { value: "Other", label: "Other" },
];

interface LostReasonDialogProps {
  dealId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * The LOST-01/LOST-02 gated reason dialog, opened directly from StageSelect's
 * "Lost" selection. Mirrors `WonContractTermsDialog.tsx`'s structure exactly
 * (standalone Dialog, not a Popover anchored to the Select that triggers
 * it) — the prior Popover-anchored-to-Select version was a known Radix
 * interaction conflict: the Select's own internal dropdown-close dismissal
 * raced with the enclosing Popover's dismiss-on-outside-click layer, closing
 * the Popover immediately after it opened, so picking "Lost" appeared to do
 * nothing. Submitting calls the atomic `moveToLost` store action exactly
 * once; Cancel/dismiss resets the form and calls no store action.
 */
export function LostReasonDialog({ dealId, open, onOpenChange }: LostReasonDialogProps) {
  const form = useForm<LostReasonFormValues>({
    resolver: zodResolver(lostReasonSchema),
    defaultValues: { category: undefined, note: "" },
  });
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (values: LostReasonFormValues) => {
    setError(null);
    try {
      await usePipelineStore.getState().moveToLost(dealId, values.category, values.note || undefined);
      form.reset({ category: undefined, note: "" });
      onOpenChange(false);
    } catch {
      // Keep the dialog open with the user's selections intact — never
      // close or reset on a failed submit (UI-SPEC error-state contract).
      setError(UPDATE_FAILED_MESSAGE);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      form.reset({ category: undefined, note: "" });
      setError(null);
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark as Lost</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FieldGroup>
            <Controller
              name="category"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Reason</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id={field.name} aria-invalid={fieldState.invalid} className="w-full">
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {REASON_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="note"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Note (optional)</FieldLabel>
                  <Textarea {...field} id={field.name} aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!form.watch("category")}>
              Mark as Lost
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
