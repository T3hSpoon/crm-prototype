import { Fragment, useState } from "react";
import { flexRender } from "@tanstack/react-table";
// TanStack Table v9.2.3 replaced the v8 useReactTable/createColumnHelper API
// with a new features-based useTable hook (see @tanstack/react-table's
// dist/useTable.d.ts). The package ships a `/legacy` compat subpath that
// preserves the exact v8-style shape the plan calls for (useReactTable ->
// useLegacyTable, createColumnHelper -> legacyCreateColumnHelper,
// getCoreRowModel is a same-named no-op stub since v9 always builds the core
// row model). Using it keeps this file's row-model surface literally free of
// getGroupedRowModel/getSortedRowModel/getFilteredRowModel, matching the
// plan's acceptance criteria and its "getCoreRowModel() only" intent.
import { getCoreRowModel, legacyCreateColumnHelper, useLegacyTable } from "@tanstack/react-table/legacy";
import { ChevronRight } from "lucide-react";
import { StageSelect } from "@/features/pipeline/components/StageSelect";
import { EditableCell } from "@/features/pipeline/components/EditableCell";
import { LineItemsTable } from "@/features/pipeline/components/LineItemsTable";
import type { Deal } from "@/shared/types/deal";
import { toPipelineGroup } from "@/shared/utils/pipeline-group";
import { hasManualOverride } from "@/shared/utils/line-items";
import { cn } from "@/lib/utils";

const columnHelper = legacyCreateColumnHelper<Deal>();

const columns = [
  columnHelper.accessor("name", {
    header: "Name",
    cell: (info) => (
      <EditableCell dealId={info.row.original.id} columnId="name" value={info.getValue()} />
    ),
  }),
  columnHelper.accessor("company", {
    header: "Company",
  }),
  columnHelper.accessor("value", {
    header: "Value",
    cell: (info) => (
      <EditableCell dealId={info.row.original.id} columnId="value" value={info.getValue()} />
    ),
  }),
  columnHelper.accessor("owner", {
    header: "Owner",
    cell: (info) => (
      <EditableCell dealId={info.row.original.id} columnId="owner" value={info.getValue()} />
    ),
  }),
  columnHelper.accessor("closeDate", {
    header: "Close Date",
    cell: (info) => (
      <EditableCell dealId={info.row.original.id} columnId="closeDate" value={info.getValue()} />
    ),
  }),
  columnHelper.display({
    id: "stage",
    header: "Stage",
    cell: (info) => (
      <StageSelect dealId={info.row.original.id} currentGroup={toPipelineGroup(info.row.original)} />
    ),
  }),
  columnHelper.display({
    id: "id",
    header: "ID",
    cell: (info) => (
      <span className="text-xs font-mono text-muted-foreground">{info.row.original.id}</span>
    ),
  }),
];

interface DealTableProps {
  deals: Deal[];
}

/**
 * Headless @tanstack/react-table wrapper for a single pipeline group's rows.
 * Uses getCoreRowModel() only — no sorting/filtering/grouping row models
 * this phase (Phase 4, PIPE-05/06). Never renders getGroupedRowModel; each
 * GroupSection already owns its own pre-partitioned `deals` slice (see
 * usePipelineGroups / 01-RESEARCH.md Pattern 1).
 */
export function DealTable({ deals }: DealTableProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = (dealId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(dealId)) {
        next.delete(dealId);
      } else {
        next.add(dealId);
      }
      return next;
    });
  };

  const expandColumn = columnHelper.display({
    id: "expand",
    header: () => null,
    cell: (info) => {
      const dealId = info.row.original.id;
      const isExpanded = expandedIds.has(dealId);
      return (
        <button
          type="button"
          aria-label={isExpanded ? "Collapse line items" : "Expand line items"}
          aria-expanded={isExpanded}
          onClick={(e) => {
            e.stopPropagation();
            toggleExpanded(dealId);
          }}
        >
          <ChevronRight className={cn("size-4 transition-transform", isExpanded && "rotate-90")} />
        </button>
      );
    },
  });

  const tableColumns = [expandColumn, ...columns];

  const table = useLegacyTable({
    data: deals,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-max text-left text-sm">
        <thead className="bg-muted/50 text-muted-foreground">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="px-4 py-2 font-medium">
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {deals.length === 0 ? (
            <tr>
              <td
                colSpan={tableColumns.length}
                className="px-4 py-6 text-center text-muted-foreground"
              >
                No deals in this group yet.
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <Fragment key={row.id}>
                <tr className="border-t border-border">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-2">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
                {expandedIds.has(row.original.id) && (
                  <tr className="border-t border-border bg-muted/20">
                    <td colSpan={tableColumns.length} className="px-4 py-3">
                      <LineItemsTable
                        dealId={row.original.id}
                        lineItems={row.original.lineItems}
                        value={row.original.value}
                        overridden={hasManualOverride(row.original)}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
