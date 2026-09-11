import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePipelineStore } from "@/features/pipeline/store/pipelineStore";
import { lostReasonSchema, type LostReasonFormValues } from "@/features/pipeline/components/lost-reason-schema";

/** Fixed 5-option Reason list, verbatim (D-03). */
const REASON_OPTIONS: { value: LostReasonFormValues["category"]; label: string }[] = [
  { value: "Price", label: "Price" },
  { value: "Timing", label: "Timing" },
  { value: "Competitor", label: "Competitor" },
  { value: "No Budget", label: "No Budget" },
  { value: "Other", label: "Other" },
];

interface LostReasonPopoverProps {
  dealId: string;
  onClose: () => void;
}

/**
 * Form content rendered inside StageSelect's shared Popover (does NOT own
 * its own Popover.Root) — the D-01/D-02/D-03/D-04 gated Lost-reason form
 * (Phase 3.1, LOST-01/LOST-02). Submitting calls the atomic `moveToLost`
 * store action exactly once; dismissal (Escape/click-away) is handled
 * entirely by StageSelect's Popover onOpenChange, which never touches this
 * component's submit path.
 */
export function LostReasonPopover({ dealId, onClose }: LostReasonPopoverProps) {
  const form = useForm<LostReasonFormValues>({
    resolver: zodResolver(lostReasonSchema),
  });

  const onSubmit = async (values: LostReasonFormValues) => {
    await usePipelineStore.getState().moveToLost(dealId, values.category, values.note || undefined);
    onClose();
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-base font-medium leading-none">Mark as Lost</p>
      <p className="text-sm text-muted-foreground">Why was this deal lost?</p>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-2">
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
        <Button type="submit" disabled={!form.watch("category")}>
          Mark as Lost
        </Button>
      </form>
    </div>
  );
}
