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
  addDealSchema,
  type AddDealFormInput,
  type AddDealFormValues,
} from "@/features/pipeline/components/add-deal-schema";

/** Same 5 labeled stage options this dialog and StageSelect both use. */
const GROUP_OPTIONS: { value: AddDealFormValues["group"]; label: string }[] = [
  { value: "prospect", label: "Prospect" },
  { value: "lead", label: "Lead" },
  { value: "opportunity", label: "Opportunity" },
  { value: "deal", label: "Deal / Won" },
  { value: "lost", label: "Lost" },
];

/** Frequency selector options, step 2 (Phase 3, DEAL-06, D-07). */
const FREQUENCY_OPTIONS: { value: AddDealFormValues["frequency"]; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "quadrimestral", label: "Quadrimestral" },
  { value: "semi-annual", label: "Semi-Annual" },
  { value: "annually", label: "Annually" },
];

/** Currency selector options, step 2 (Phase 3, DEAL-06, D-08). */
const CURRENCY_OPTIONS: { value: AddDealFormValues["currency"]; label: string }[] = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
];

/** Prorata yes/no selector options, step 2 (Phase 3, DEAL-06, D-04). */
const PRORATA_OPTIONS: { value: "yes" | "no"; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const DEFAULT_VALUES: AddDealFormInput = {
  name: "",
  company: "",
  value: 0,
  owner: "",
  closeDate: "",
  group: "prospect",
  prorata: "no",
  gracePeriodDays: 0,
  contractTermMonths: 0,
  frequency: "monthly",
  currency: "USD",
};

interface AddDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Modal implementing a 2-step wizard (Phase 3, DEAL-06, D-01/D-02/D-03):
 * step 1 keeps the original 6-field intake (DEAL-01), step 2 captures the 5
 * new deal-terms fields (Prorata, Grace Period, Contract Term, Frequency,
 * Currency) for every new deal regardless of which pipeline stage/group is
 * selected on step 1. Both steps share a single `useForm` instance, so
 * Back/Next never lose values. On valid step-2 submit, calls
 * usePipelineStore().addDeal() then closes immediately.
 */
export function AddDealDialog({ open, onOpenChange }: AddDealDialogProps) {
  const addDeal = usePipelineStore((s) => s.addDeal);
  const [step, setStep] = useState<1 | 2>(1);
  const form = useForm<AddDealFormInput, unknown, AddDealFormValues>({
    resolver: zodResolver(addDealSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const onSubmit = async (values: AddDealFormValues) => {
    // `prorata` is "yes"/"no" in AddDealFormValues (see add-deal-schema.ts
    // comment) — convert to boolean here to match NewDealInput.prorata.
    await addDeal({ ...values, prorata: values.prorata === "yes" });
    form.reset(DEFAULT_VALUES);
    setStep(1);
    onOpenChange(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      form.reset(DEFAULT_VALUES);
      setStep(1);
    }
    onOpenChange(next);
  };

  const handleNext = async () => {
    const valid = await form.trigger(["name", "company", "value", "owner", "closeDate", "group"]);
    if (valid) setStep(2);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Deal</DialogTitle>
        </DialogHeader>
        <p className="text-base font-medium leading-none">
          {step === 1 ? "Step 1 of 2" : "Step 2 of 2 — Deal Terms"}
        </p>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {step === 1 && (
            <FieldGroup>
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                    <Input {...field} id={field.name} aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="company"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Company</FieldLabel>
                    <Input {...field} id={field.name} aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="owner"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Owner</FieldLabel>
                    <Input {...field} id={field.name} aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="group"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Stage</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id={field.name} aria-invalid={fieldState.invalid} className="w-full">
                        <SelectValue placeholder="Select a stage" />
                      </SelectTrigger>
                      <SelectContent>
                        {GROUP_OPTIONS.map((option) => (
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
          )}
          {step === 2 && (
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
            </FieldGroup>
          )}
          <DialogFooter>
            {step === 1 && (
              <Button type="button" onClick={handleNext}>
                Next
              </Button>
            )}
            {step === 2 && (
              <>
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="submit">Create Deal</Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
