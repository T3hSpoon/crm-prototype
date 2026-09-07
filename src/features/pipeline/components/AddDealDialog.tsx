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

const DEFAULT_VALUES: AddDealFormInput = {
  name: "",
  company: "",
  value: 0,
  owner: "",
  closeDate: "",
  group: "prospect",
};

interface AddDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Modal form implementing D-01 through D-04: full 5-field intake + stage
 * selector (D-01/D-02), triggered as a Dialog by the parent (D-03), and on
 * valid submit calls usePipelineStore().addDeal() then closes immediately
 * (D-04, no batch-add/keep-open mode). Invalid submits never reach the
 * store and keep the dialog open with inline field errors.
 */
export function AddDealDialog({ open, onOpenChange }: AddDealDialogProps) {
  const addDeal = usePipelineStore((s) => s.addDeal);
  const form = useForm<AddDealFormInput, unknown, AddDealFormValues>({
    resolver: zodResolver(addDealSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const onSubmit = async (values: AddDealFormValues) => {
    await addDeal(values);
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
          <DialogTitle>Add Deal</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
          <DialogFooter>
            <Button type="submit">Add Deal</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
