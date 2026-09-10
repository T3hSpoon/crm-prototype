import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
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

/** Customer Type selector options, step 2 (Quick task 260910-ec8). */
const CUSTOMER_TYPE_OPTIONS: { value: AddDealFormValues["customerType"]; label: string }[] = [
  { value: "government", label: "Government" },
  { value: "private-utility", label: "Private Utility" },
  { value: "private-fleet", label: "Private Fleet" },
  { value: "similar", label: "Similar" },
];

/** Confidence Level selector options, step 2 (Quick task 260910-ec8). */
const CONFIDENCE_LEVEL_OPTIONS: { value: AddDealFormValues["confidenceLevel"]; label: string }[] = [
  { value: "100", label: "100%" },
  { value: "80", label: "80%" },
  { value: "50", label: "50%" },
  { value: "open-to-rfp", label: "Open to RFP Bids" },
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
  customerType: "similar",
  confidenceLevel: "open-to-rfp",
  arpu: undefined,
  mrr: undefined,
  arr: undefined,
  lifetimeContractValue: undefined,
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

  // Live auto-calc: ARR = MRR x 12, Lifetime Contract Value = MRR x Contract
  // Term (months) — mirrors DEAL-05's auto-track-with-manual-override shape
  // (comparison-based, no extra stored boolean), adapted for a pre-creation
  // form via react-hook-form's own `formState.dirtyFields` instead of a
  // persisted-Deal comparison (RESEARCH.md). Scoped to exactly these two
  // field names, not the whole form, to minimize re-render surface.
  const [mrr, contractTermMonths] = useWatch({
    control: form.control,
    name: ["mrr", "contractTermMonths"],
  });

  useEffect(() => {
    const mrrNum = Number(mrr);
    if (!mrr || Number.isNaN(mrrNum)) return;
    if (!form.formState.dirtyFields.arr) {
      // Explicitly opting out of marking the field dirty is essential here —
      // omitting that option would mark `arr` dirty on this very write,
      // permanently locking auto-calc off on the next effect run even
      // though the user never typed anything.
      form.setValue("arr", mrrNum * 12, { shouldDirty: false, shouldValidate: false });
    }
    if (!form.formState.dirtyFields.lifetimeContractValue) {
      const termNum = Number(contractTermMonths) || 0;
      form.setValue("lifetimeContractValue", mrrNum * termNum, {
        shouldDirty: false,
        shouldValidate: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- form/setValue stable refs
  }, [mrr, contractTermMonths]);

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
    const valid = await form.trigger(["name", "company", "owner", "closeDate", "group"]);
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
              <Controller
                name="arpu"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>ARPU</FieldLabel>
                    <Input
                      {...field}
                      value={(field.value as string | number | undefined) ?? ""}
                      id={field.name}
                      type="number"
                      min={0}
                      step="0.01"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="mrr"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>MRR</FieldLabel>
                    <Input
                      {...field}
                      value={(field.value as string | number | undefined) ?? ""}
                      id={field.name}
                      type="number"
                      min={0}
                      step="0.01"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="arr"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>ARR</FieldLabel>
                    <Input
                      {...field}
                      value={(field.value as string | number | undefined) ?? ""}
                      id={field.name}
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="Auto-calculated from MRR x 12"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldDescription>Auto-calculated from MRR unless edited directly</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="lifetimeContractValue"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Lifetime Contract Value</FieldLabel>
                    <Input
                      {...field}
                      value={(field.value as string | number | undefined) ?? ""}
                      id={field.name}
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="Auto-calculated from MRR x Contract Term"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldDescription>
                      Auto-calculated from MRR and Contract Term unless edited directly
                    </FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldGroup>
          )}
          <DialogFooter>
            {step === 1 && (
              <>
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancel Add Deal
                </Button>
                <Button type="button" onClick={handleNext}>
                  Next
                </Button>
              </>
            )}
            {step === 2 && (
              <>
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancel Add Deal
                </Button>
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
