import { useState, type ChangeEvent } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RotateCcw } from "lucide-react";
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
import { DealTermsDialog } from "@/features/pipeline/components/DealTermsDialog";
import { UPDATE_FAILED_MESSAGE } from "@/features/pipeline/constants";
import type { Deal, LineItem, LineItemType } from "@/shared/types/deal";
import { computeSubtotal, sumLineItems } from "@/shared/utils/line-items";

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
  /** The deal's current value — used to decide whether to fold an
   * auto-tracked value patch into the same commit as the line-item change. */
  value: number;
  /** Whether the deal's value has diverged from its computed line-item sum
   * (DEAL-05). While overridden, line-item commits never silently rewrite
   * `value` — only the drawer's explicit reset-to-sum affordance does. */
  overridden: boolean;
  /** The full deal — used only by the Document Actions section below (quick
   * task 260918-fis). Existing lineItems/value/overridden prop reads are
   * untouched. */
  deal: Deal;
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
export function LineItemsTable({ dealId, lineItems, overridden, deal }: LineItemsTableProps) {
  // One flag for the whole table — commitLineItems() always patches the
  // entire array in a single call, so there is no meaningful per-row
  // in-flight state (Pitfall 5 double-submit guard, carried forward from
  // 02-01's EditableCell/DealDetailDrawer pattern).
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Independent pending/error state for the Document Actions section below —
  // separate from the line-item isPending/error above so an in-flight
  // document generation never disables line-item editing or vice versa.
  const [isDocPending, setIsDocPending] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  // Local open-state for the Deal Terms inspect/edit dialog (quick task
  // 260921-e8z) — mirrors StageSelect.tsx's pendingGroup-gated
  // LostReasonDialog/WonContractTermsDialog conditional-mount pattern.
  const [dealTermsOpen, setDealTermsOpen] = useState(false);
  // Never stored — always freshly derived every render (DEAL-05), mirroring
  // the removed drawer's own computation. Uses the last-committed `lineItems`
  // prop, not the form's live in-progress draft.
  const computed = sumLineItems(lineItems);
  // A Lost deal is a closed/terminal record — no further line-item edits or
  // new document generation. The Lost Reason display below takes the place
  // of "Add Line Item" for these deals. Existing documents remain viewable
  // via DealTable's own Documents column regardless of this flag.
  const isLost = deal.outcome === "lost";

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

  const handleResetToSum = () => {
    if (isPending) return;
    void usePipelineStore.getState().updateDeal(dealId, { value: computed });
  };

  const handleGenerate = async (kind: "quote" | "agreement") => {
    if (isDocPending) return;
    setIsDocPending(true);
    try {
      await usePipelineStore.getState().generateDocument(dealId, kind);
      setDocError(null);
    } catch {
      setDocError(UPDATE_FAILED_MESSAGE);
    } finally {
      setIsDocPending(false);
    }
  };

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset immediately so re-selecting the same filename later still fires
    // onChange.
    e.target.value = "";
    if (!file || isDocPending) return;
    setIsDocPending(true);
    try {
      await usePipelineStore.getState().uploadDocument(dealId, file);
      setDocError(null);
    } catch {
      setDocError(UPDATE_FAILED_MESSAGE);
    } finally {
      setIsDocPending(false);
    }
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
      {isLost ? (
        deal.lostReason && (
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium text-muted-foreground">Lost Reason</span>
            <span className="text-sm">{deal.lostReason}</span>
          </div>
        )
      ) : (
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={handleAdd}>
            Add Line Item
          </Button>
          {overridden && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={handleResetToSum}
            >
              <RotateCcw data-icon="inline-start" />
              Reset to sum ({currencyFormatter.format(computed)})
            </Button>
          )}
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-2">
        {!isLost && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isDocPending}
              onClick={() => void handleGenerate("quote")}
            >
              Generate Quote
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isDocPending}
              onClick={() => void handleGenerate("agreement")}
            >
              Generate Agreement
            </Button>
            <Input
              type="file"
              accept="application/pdf"
              disabled={isDocPending}
              className="max-w-48"
              onChange={(e) => void handleUpload(e)}
              aria-label="Upload PDF"
            />
            {deal.documents.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {deal.documents.length} document{deal.documents.length === 1 ? "" : "s"}
              </span>
            )}
          </div>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="ml-auto"
          onClick={() => setDealTermsOpen(true)}
        >
          Deal Terms
        </Button>
      </div>
      {dealTermsOpen && (
        <DealTermsDialog deal={deal} open onOpenChange={() => setDealTermsOpen(false)} />
      )}
      {docError && (
        <p role="alert" className="text-sm text-destructive">
          {docError}
        </p>
      )}
    </div>
  );
}
