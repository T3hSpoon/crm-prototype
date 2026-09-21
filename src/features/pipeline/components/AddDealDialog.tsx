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
import {
  getCompanyNames,
  getPrimeGroupsForCompany,
  type AccountPrimeGroup,
} from "@/data/mock/accounts-directory";

/**
 * Company selector options, step 1 (Quick task 260921-f5a) — sourced from
 * the static `ACCOUNTS_DIRECTORY`, safe to compute once at module scope.
 */
const COMPANY_OPTIONS = getCompanyNames();

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
  primeGroup: "",
  address: "",
  contact: "",
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
};

interface AddDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Modal implementing a 2-step wizard (Phase 3, DEAL-06, D-01/D-02/D-03):
 * step 1 is now a 9-field intake (DEAL-01 original 6 plus the
 * primeGroup/address/contact account-context cascade added by Quick task
 * 260921-f5a), step 2 captures the 5 deal-terms fields (Prorata, Grace
 * Period, Contract Term, Frequency, Currency) for every new deal regardless
 * of which pipeline stage/group is selected on step 1. Both steps share a
 * single `useForm` instance, so Back/Next never lose values. On valid
 * step-2 submit, calls usePipelineStore().addDeal() then closes
 * immediately.
 */
export function AddDealDialog({ open, onOpenChange }: AddDealDialogProps) {
  const addDeal = usePipelineStore((s) => s.addDeal);
  const [step, setStep] = useState<1 | 2>(1);
  const form = useForm<AddDealFormInput, unknown, AddDealFormValues>({
    resolver: zodResolver(addDealSchema),
    defaultValues: DEFAULT_VALUES,
  });
  // Company -> Prime Group -> Address -> Contact cascade (Quick task
  // 260921-f5a). Recomputed each render — ACCOUNTS_DIRECTORY is tiny static
  // data, no memoization needed, matching this file's existing style.
  const watchedCompany = form.watch("company");
  const watchedPrimeGroup = form.watch("primeGroup");
  const primeGroupOptions: AccountPrimeGroup[] = getPrimeGroupsForCompany(watchedCompany);
  const selectedPrimeGroup = primeGroupOptions.find((pg) => pg.name === watchedPrimeGroup);

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
    const valid = await form.trigger([
      "name",
      "company",
      "primeGroup",
      "address",
      "contact",
      "owner",
      "closeDate",
      "group",
    ]);
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
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue("primeGroup", "");
                        form.setValue("address", "");
                        form.setValue("contact", "");
                      }}
                    >
                      <SelectTrigger id={field.name} aria-invalid={fieldState.invalid} className="w-full">
                        <SelectValue placeholder="Select a company" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPANY_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="primeGroup"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Prime Group</FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue("address", "");
                        form.setValue("contact", "");
                      }}
                      disabled={!watchedCompany}
                    >
                      <SelectTrigger id={field.name} aria-invalid={fieldState.invalid} className="w-full">
                        <SelectValue
                          placeholder={watchedCompany ? "Select a prime group" : "Select a company first"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {primeGroupOptions.map((pg) => (
                          <SelectItem key={pg.id} value={pg.name}>
                            {pg.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="address"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Address</FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => field.onChange(value)}
                      disabled={!watchedPrimeGroup}
                    >
                      <SelectTrigger id={field.name} aria-invalid={fieldState.invalid} className="w-full">
                        <SelectValue
                          placeholder={watchedPrimeGroup ? "Select an address" : "Select a prime group first"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {(selectedPrimeGroup ? [selectedPrimeGroup.address] : []).map((address) => (
                          <SelectItem key={address} value={address}>
                            {address}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="contact"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Contact</FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => field.onChange(value)}
                      disabled={!watchedPrimeGroup}
                    >
                      <SelectTrigger id={field.name} aria-invalid={fieldState.invalid} className="w-full">
                        <SelectValue
                          placeholder={watchedPrimeGroup ? "Select a contact" : "Select a prime group first"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {(selectedPrimeGroup?.contacts ?? []).map((c) => (
                          <SelectItem key={c.id} value={c.name}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
