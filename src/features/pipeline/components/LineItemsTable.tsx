import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePipelineStore } from "@/features/pipeline/store/pipelineStore";
import {
  lineItemsSchema,
  type LineItemsFormInput,
  type LineItemsFormValues,
} from "@/features/pipeline/components/deal-edit-schema";
import type { LineItem, LineItemType } from "@/shared/types/deal";
import { computeSubtotal } from "@/shared/utils/line-items";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const TYPE_OPTIONS: { value: LineItemType; label: string }[] = [
  { value: "product", label: "Product" },
  { value: "service", label: "Service" },
];

interface LineItemsTableProps {
  dealId: string;
  lineItems: LineItem[];
}

/**
 * useFieldArray-backed line-item CRUD mini-table inside the drawer (DEAL-04).
 * Table shell matches DealTable's visual pattern (overflow wrapper, thead,
 * empty-row copy). Every field commits independently on blur/change via
 * `commitLineItems()`, which reads the table's FULL current form state (not
 * a single row in isolation) and patches the entire `lineItems` array in one
 * `updateDeal` call — closes the DEAL-04 concurrency gap.
 */
export function LineItemsTable({ dealId, lineItems }: LineItemsTableProps) {
  const form = useForm<LineItemsFormInput, unknown, LineItemsFormValues>({
    resolver: zodResolver(lineItemsSchema),
    values: { lineItems },
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lineItems",
  });

  const commitLineItems = async () => {
    // form.getValues() returns the pre-coercion input shape (z.input — units/
    // unitPrice are `unknown` prior to z.coerce.number() running); coerce
    // explicitly here since we bypass handleSubmit's own coercion step.
    const raw = form.getValues("lineItems");
    const nextLineItems: LineItem[] = raw.map((item) => ({
      id: item.id,
      productOrService: item.productOrService,
      sku: item.sku,
      units: Number(item.units),
      unitPrice: Number(item.unitPrice),
      type: item.type,
    }));
    await usePipelineStore.getState().updateDeal(dealId, { lineItems: nextLineItems });
  };

  const handleAdd = () => {
    append({
      id: crypto.randomUUID(),
      productOrService: "",
      sku: "",
      units: 1,
      unitPrice: 0,
      type: "product",
    });
    void commitLineItems();
  };

  const handleRemove = (index: number) => {
    remove(index);
    void commitLineItems();
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-max text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-2 font-medium">Product/Service</th>
              <th className="px-4 py-2 font-medium">SKU</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Units</th>
              <th className="px-4 py-2 font-medium">Unit Price</th>
              <th className="px-4 py-2 font-medium">Subtotal</th>
              <th className="px-4 py-2 font-medium">
                <span className="sr-only">Remove</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {fields.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                  <p className="font-medium text-foreground">No line items yet.</p>
                  <p>Add a line item to start building this deal's value automatically.</p>
                </td>
              </tr>
            ) : (
              fields.map((field, index) => {
                const rowValues = form.watch(`lineItems.${index}`);
                const subtotal = computeSubtotal({
                  units: Number(rowValues?.units ?? field.units),
                  unitPrice: Number(rowValues?.unitPrice ?? field.unitPrice),
                });
                return (
                  <tr key={field.id} className="border-t border-border">
                    <td className="px-4 py-2">
                      <Controller
                        name={`lineItems.${index}.productOrService`}
                        control={form.control}
                        render={({ field: rhfField, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <Input
                              {...rhfField}
                              className="truncate"
                              title={rhfField.value}
                              aria-invalid={fieldState.invalid}
                              onBlur={() => {
                                rhfField.onBlur();
                                if (!fieldState.invalid) void commitLineItems();
                              }}
                            />
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                          </Field>
                        )}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Controller
                        name={`lineItems.${index}.sku`}
                        control={form.control}
                        render={({ field: rhfField, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <Input
                              {...rhfField}
                              className="truncate"
                              title={rhfField.value}
                              aria-invalid={fieldState.invalid}
                              onBlur={() => {
                                rhfField.onBlur();
                                if (!fieldState.invalid) void commitLineItems();
                              }}
                            />
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                          </Field>
                        )}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Controller
                        name={`lineItems.${index}.type`}
                        control={form.control}
                        render={({ field: rhfField }) => (
                          <Select
                            value={rhfField.value}
                            onValueChange={(next) => {
                              rhfField.onChange(next);
                              void commitLineItems();
                            }}
                          >
                            <SelectTrigger size="sm" aria-label="Line item type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TYPE_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Controller
                        name={`lineItems.${index}.units`}
                        control={form.control}
                        render={({ field: rhfField, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <Input
                              {...rhfField}
                              value={(rhfField.value as string | number | undefined) ?? ""}
                              type="number"
                              min={0}
                              step="any"
                              className="w-20"
                              aria-invalid={fieldState.invalid}
                              onBlur={() => {
                                rhfField.onBlur();
                                if (!fieldState.invalid) void commitLineItems();
                              }}
                            />
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                          </Field>
                        )}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Controller
                        name={`lineItems.${index}.unitPrice`}
                        control={form.control}
                        render={({ field: rhfField, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <Input
                              {...rhfField}
                              value={(rhfField.value as string | number | undefined) ?? ""}
                              type="number"
                              min={0}
                              step="any"
                              className="w-24"
                              aria-invalid={fieldState.invalid}
                              onBlur={() => {
                                rhfField.onBlur();
                                if (!fieldState.invalid) void commitLineItems();
                              }}
                            />
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                          </Field>
                        )}
                      />
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {currencyFormatter.format(subtotal)}
                    </td>
                    <td className="px-4 py-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Remove line item"
                        onClick={() => handleRemove(index)}
                      >
                        &times;
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div>
        <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
          Add Line Item
        </Button>
      </div>
    </div>
  );
}
