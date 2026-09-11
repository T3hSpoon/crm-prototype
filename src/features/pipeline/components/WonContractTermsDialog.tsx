import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addMonths, format, parseISO } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePipelineStore } from "@/features/pipeline/store/pipelineStore";
import {
  wonContractTermsSchema,
  type WonContractTermsFormValues,
} from "@/features/pipeline/components/won-contract-terms-schema";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const DEFAULT_VALUES: WonContractTermsFormValues = {
  contractStartDate: "",
  contractEndDate: "",
  contractSignedDate: "",
  paymentTerms: "",
};

interface WonContractTermsDialogProps {
  dealId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * The WON-01 gated contract-terms modal, opened directly from StageSelect's
 * "Won" selection (no intermediate confirm screen, per 03.1-UI-SPEC.md
 * Assumptions Made #1). Submitting calls the atomic `moveToWon` store action
 * exactly once; Cancel/dismiss resets the form and calls no store action.
 */
export function WonContractTermsDialog({ dealId, open, onOpenChange }: WonContractTermsDialogProps) {
  const deal = usePipelineStore((s) => s.deals.find((d) => d.id === dealId));
  const form = useForm<WonContractTermsFormValues>({
    resolver: zodResolver(wonContractTermsSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const startDate = form.watch("contractStartDate");
  useEffect(() => {
    if (!startDate || !deal || form.formState.dirtyFields.contractEndDate) return;
    form.setValue(
      "contractEndDate",
      format(addMonths(parseISO(startDate), deal.contractTermMonths), "yyyy-MM-dd"),
      { shouldValidate: true },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, deal]);

  const onSubmit = async (values: WonContractTermsFormValues) => {
    await usePipelineStore.getState().moveToWon(dealId, values);
    form.reset(DEFAULT_VALUES);
    onOpenChange(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      form.reset(DEFAULT_VALUES);
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark Deal as Won</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FieldGroup>
            <Controller
              name="contractStartDate"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Contract Start Date</FieldLabel>
                  <Input {...field} id={field.name} type="date" aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="contractEndDate"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Contract End Date</FieldLabel>
                  <Input {...field} id={field.name} type="date" aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="contractSignedDate"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Signed Date</FieldLabel>
                  <Input {...field} id={field.name} type="date" aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="paymentTerms"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Payment Terms</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="text"
                    placeholder="e.g. Net 30, billed monthly"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Field>
              <FieldLabel>Final Contract Value</FieldLabel>
              <div className="rounded-lg border border-input bg-muted px-2.5 py-1 text-base md:text-sm">
                {currencyFormatter.format(deal?.value ?? 0)}
              </div>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Confirm Won</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
