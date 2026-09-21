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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePipelineStore } from "@/features/pipeline/store/pipelineStore";
import {
  dealTermsSchema,
  type DealTermsFormInput,
  type DealTermsFormValues,
} from "@/features/pipeline/components/deal-terms-schema";
import { UPDATE_FAILED_MESSAGE } from "@/features/pipeline/constants";
import type { Deal } from "@/shared/types/deal";

/** Prorata yes/no selector options — copied verbatim from AddDealDialog.tsx. */
const PRORATA_OPTIONS: { value: DealTermsFormValues["prorata"]; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

/** Frequency selector options — copied verbatim from AddDealDialog.tsx. */
const FREQUENCY_OPTIONS: { value: DealTermsFormValues["frequency"]; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "quadrimestral", label: "Quadrimestral" },
  { value: "semi-annual", label: "Semi-Annual" },
  { value: "annually", label: "Annually" },
];

/** Currency selector options — copied verbatim from AddDealDialog.tsx. */
const CURRENCY_OPTIONS: { value: DealTermsFormValues["currency"]; label: string }[] = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
];

/** Customer Type selector options — copied verbatim from AddDealDialog.tsx. */
const CUSTOMER_TYPE_OPTIONS: { value: DealTermsFormValues["customerType"]; label: string }[] = [
  { value: "government", label: "Government" },
  { value: "private-utility", label: "Private Utility" },
  { value: "private-fleet", label: "Private Fleet" },
  { value: "similar", label: "Similar" },
];

/** Confidence Level selector options — copied verbatim from AddDealDialog.tsx. */
const CONFIDENCE_LEVEL_OPTIONS: { value: DealTermsFormValues["confidenceLevel"]; label: string }[] = [
  { value: "100", label: "100%" },
  { value: "80", label: "80%" },
  { value: "50", label: "50%" },
  { value: "open-to-rfp", label: "Open to RFP Bids" },
];

function toDealTermsFormValues(deal: Deal): DealTermsFormInput {
  return {
    prorata: deal.prorata ? "yes" : "no",
    gracePeriodDays: deal.gracePeriodDays,
    contractTermMonths: deal.contractTermMonths,
    frequency: deal.frequency,
    currency: deal.currency,
    customerType: deal.customerType,
    confidenceLevel: deal.confidenceLevel,
  };
}

interface DealTermsDialogProps {
  deal: Deal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Inspect/edit modal for an existing deal's 7 deal-terms fields (quick task
 * 260921-e8z), structurally mirroring `WonContractTermsDialog.tsx` (standalone
 * Dialog, react-hook-form + zodResolver, inline error state kept on failed
 * submit — never auto-close/reset on error). Only ever mounted while `open`
 * (conditionally rendered by its caller, exactly like `StageSelect.tsx`
 * mounts `LostReasonDialog`/`WonContractTermsDialog`), so `defaultValues`
 * computed once at mount already reflects the current deal — no `useEffect`
 * re-sync needed.
 */
export function DealTermsDialog({ deal, open, onOpenChange }: DealTermsDialogProps) {
  const form = useForm<DealTermsFormInput, unknown, DealTermsFormValues>({
    resolver: zodResolver(dealTermsSchema),
    defaultValues: toDealTermsFormValues(deal),
  });
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (values: DealTermsFormValues) => {
    setError(null);
    try {
      await usePipelineStore.getState().updateDeal(deal.id, {
        prorata: values.prorata === "yes",
        gracePeriodDays: values.gracePeriodDays,
        contractTermMonths: values.contractTermMonths,
        frequency: values.frequency,
        currency: values.currency,
        customerType: values.customerType,
        confidenceLevel: values.confidenceLevel,
      });
      form.reset(toDealTermsFormValues(deal));
      onOpenChange(false);
    } catch {
      // Keep the dialog open with the user's entered values intact — never
      // close or reset on a failed submit (mirrors WonContractTermsDialog's
      // error-state contract).
      setError(UPDATE_FAILED_MESSAGE);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      form.reset(toDealTermsFormValues(deal));
      setError(null);
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Deal Terms</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FieldGroup>
            <Controller
              name="prorata"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Prorata</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id={field.name} aria-invalid={fieldState.invalid} className="w-full">
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRORATA_OPTIONS.map((option) => (
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
              name="gracePeriodDays"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Grace Period (days)</FieldLabel>
                  <Input
                    {...field}
                    value={(field.value as string | number | undefined) ?? ""}
                    id={field.name}
                    type="number"
                    min={0}
                    step="1"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="contractTermMonths"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Contract Term (months)</FieldLabel>
                  <Input
                    {...field}
                    value={(field.value as string | number | undefined) ?? ""}
                    id={field.name}
                    type="number"
                    min={0}
                    step="1"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="frequency"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Frequency</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id={field.name} aria-invalid={fieldState.invalid} className="w-full">
                      <SelectValue placeholder="Select a frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCY_OPTIONS.map((option) => (
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
              name="currency"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Currency</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id={field.name} aria-invalid={fieldState.invalid} className="w-full">
                      <SelectValue placeholder="Select a currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCY_OPTIONS.map((option) => (
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
              name="customerType"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Customer Type</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id={field.name} aria-invalid={fieldState.invalid} className="w-full">
                      <SelectValue placeholder="Select a customer type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CUSTOMER_TYPE_OPTIONS.map((option) => (
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
              name="confidenceLevel"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Confidence Level</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id={field.name} aria-invalid={fieldState.invalid} className="w-full">
                      <SelectValue placeholder="Select a confidence level" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONFIDENCE_LEVEL_OPTIONS.map((option) => (
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
          </FieldGroup>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
