import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { usePipelineStore } from "@/features/pipeline/store/pipelineStore";
import {
  dealEditSchema,
  type DealEditFormInput,
  type DealEditFormValues,
} from "@/features/pipeline/components/deal-edit-schema";
import type { PipelineGroup } from "@/shared/types/deal";
import { toPipelineGroup } from "@/shared/utils/pipeline-group";

/** Same 5 labeled stage options StageSelect/AddDealDialog both use. */
const GROUP_LABELS: Record<PipelineGroup, string> = {
  prospect: "Prospect",
  lead: "Lead",
  opportunity: "Opportunity",
  deal: "Deal / Won",
  lost: "Lost",
};

interface DealDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealId: string | null;
}

/**
 * Controlled Sheet-based deal detail drawer implementing D-01/D-03: opened
 * from a pipeline-table row click, showing the deal's full identity, with
 * auto-committing core-field edits on blur. A field commit handler must
 * never programmatically close the sheet — only the Sheet's own close
 * affordances (close button, overlay click, Escape) ever close it (D-03).
 */
export function DealDetailDrawer({ open, onOpenChange, dealId }: DealDetailDrawerProps) {
  const deal = usePipelineStore((s) => s.deals.find((d) => d.id === dealId));
  const updateDeal = usePipelineStore((s) => s.updateDeal);

  const form = useForm<DealEditFormInput, unknown, DealEditFormValues>({
    resolver: zodResolver(dealEditSchema),
    values: { name: deal?.name ?? "" },
  });

  if (!deal || !dealId) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto" />
      </Sheet>
    );
  }

  const currentGroup = toPipelineGroup(deal);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="truncate" title={deal.name}>
            {deal.name}
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4 pb-4">
          <FieldGroup>
            <Field>
              <FieldLabel>Company</FieldLabel>
              <p className="text-sm text-foreground">{deal.company}</p>
            </Field>
            <Field>
              <FieldLabel>Stage</FieldLabel>
              <p className="text-sm text-foreground">{GROUP_LABELS[currentGroup]}</p>
            </Field>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    onBlur={() => {
                      field.onBlur();
                      void updateDeal(dealId, { name: field.value });
                    }}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </div>
      </SheetContent>
    </Sheet>
  );
}
