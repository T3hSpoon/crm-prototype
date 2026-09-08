import { useState } from "react";
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
import type { Deal, LineItem, LineItemType } from "@/shared/types/deal";
import { computeSubtotal, sumLineItems } from "@/shared/utils/line-items";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** Copywriting Contract "Error state" row, 02-UI-SPEC.md — same text used by
 * the drawer's core fields and EditableCell. */
const UPDATE_FAILED_MESSAGE = "Update failed — your change wasn't saved. Try again.";

const TYPE_OPTIONS: { value: LineItemType; label: string }[] = [
  { value: "product", label: "Product" },
  { value: "service", label: "Service" },
];

interface LineItemsTableProps {
  dealId: string;
  lineItems: LineItem[];
  /** The deal's current value — used to decide whether to fold an
   * auto-tracked value patch into the same commit as the line-item change. */
  value: number;
  /** Whether the deal's value has diverged from its computed line-item sum
   * (DEAL-05). While overridden, line-item commits never silently rewrite
   * `value` — only the drawer's explicit reset-to-sum affordance does. */
  overridden: boolean;
}

/**
 * useFieldArray-backed line-item CRUD mini-table inside the drawer (DEAL-04).
 * Table shell matches DealTable's visual pattern (overflow wrapper, thead,
 * empty-row copy). Every field commits independently on blur/change via
 * `commitLineItems()`, which reads the table's FULL current form state (not
 * a single row in isolation) and patches the entire `lineItems` array in one
 * `updateDeal` call — closes the DEAL-04 concurrency gap. When the deal is
 * NOT overridden, that same call also patches `value` to the freshly
 * computed sum (DEAL-05) — a single store call, never two sequential ones,
 * so an in-progress manual edit to Value cannot be raced or clobbered by a
 * separate auto-tracking write.
 */
export function LineItemsTable({ dealId, lineItems, overridden }: LineItemsTableProps) {
  // One flag for the whole table — commitLineItems() always patches the
  // entire array in a single call, so there is no meaningful per-row
  // in-flight state (Pitfall 5 double-submit guard, carried forward from
  // 02-01's EditableCell/DealDetailDrawer pattern).
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LineItemsFormInput, unknown, LineItemsFormValues>({
    resolver: zodResolver(lineItemsSchema),
    values: { lineItems },
    // Validate on blur — RHF's default "onSubmit" mode never runs the
    // resolver until a submit happens, which this form never does (every
    // commit is field-level, no submit button). Without this, a row's
    // fieldState.invalid would stay permanently false and an invalid
    // units/unitPrice value would silently commit.
    mode: "onBlur",
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lineItems",
  });

  const commitLineItems = async () => {
    if (isPending) return;
    setIsPending(true);
    try {
      // form.getValues() returns the pre-coercion input shape (z.input —
      // units/unitPrice are `unknown` prior to z.coerce.number() running);
      // coerce explicitly here since we bypass handleSubmit's own coercion.
      const raw = form.getValues("lineItems");
      const nextLineItems: LineItem[] = raw.map((item) => ({
        id: item.id,
        productOrService: item.productOrService,
        sku: item.sku,
        units: Number(item.units),
        unitPrice: Number(item.unitPrice),
        type: item.type,
      }));
      const patch: Partial<Pick<Deal, "lineItems" | "value">> = { lineItems: nextLineItems };
      if (!overridden) {
        patch.value = sumLineItems(nextLineItems);
      }
      await usePipelineStore.getState().updateDeal(dealId, patch);
      setError(null);
    } catch {
      // Revert every row to the deal's last-known-good line items (passed in
      // via the `lineItems` prop) without closing the drawer.
      form.reset({ lineItems });
      setError(UPDATE_FAILED_MESSAGE);
    } finally {
      setIsPending(false);
    }
  };

  const handleAdd = () => {
    if (isPending) return;
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
    if (isPending) return;
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
                              disabled={isPending}
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
                              disabled={isPending}
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
                            disabled={isPending}
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
                              disabled={isPending}
                              onBlur={() => {
                                rhfField.onBlur();
                                // Await the resolver directly rather than
                                // reading fieldState.invalid synchronously —
                                // the render-closure value is stale until the
                                // validation triggered by onBlur() resolves.
                                void form
                                  .trigger(`lineItems.${index}.units`)
                                  .then((valid) => valid && commitLineItems());
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
                              disabled={isPending}
                              onBlur={() => {
                                rhfField.onBlur();
                                void form
                                  .trigger(`lineItems.${index}.unitPrice`)
                                  .then((valid) => valid && commitLineItems());
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
                        disabled={isPending}
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
        <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={handleAdd}>
          Add Line Item
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
