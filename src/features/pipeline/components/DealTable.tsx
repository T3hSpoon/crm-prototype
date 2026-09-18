import { Fragment, useEffect, useState } from "react";
import type { ColumnFiltersState, OnChangeFn, SortingState } from "@tanstack/react-table";
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
import {
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  legacyCreateColumnHelper,
  useLegacyTable,
} from "@tanstack/react-table/legacy";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StageSelect } from "@/features/pipeline/components/StageSelect";
import { EditableCell } from "@/features/pipeline/components/EditableCell";
import { ConfidenceCell } from "@/features/pipeline/components/ConfidenceCell";
import { LineItemsTable } from "@/features/pipeline/components/LineItemsTable";
import type { Deal, PipelineGroup } from "@/shared/types/deal";
import { toPipelineGroup } from "@/shared/utils/pipeline-group";
import { hasManualOverride } from "@/shared/utils/line-items";
import { computeLifetimeContractValue } from "@/shared/utils/deal-metrics";
import { cn } from "@/lib/utils";

const columnHelper = legacyCreateColumnHelper<Deal>();

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const columns = [
  columnHelper.display({
    id: "id",
    header: "ID",
    enableGlobalFilter: false,
    cell: (info) => (
      <span className="text-xs font-mono text-muted-foreground">{info.row.original.id}</span>
    ),
  }),
  columnHelper.accessor("name", {
    header: "Name",
    enableGlobalFilter: true,
    cell: (info) => (
      <EditableCell dealId={info.row.original.id} columnId="name" value={info.getValue()} />
    ),
  }),
  columnHelper.accessor("company", {
    header: "Company",
    enableGlobalFilter: true,
  }),
  columnHelper.accessor("value", {
    header: ({ column }) => (
      <button
        type="button"
        className={cn("flex items-center gap-1", column.getIsSorted() && "text-primary")}
        onClick={column.getToggleSortingHandler()}
      >
        Value
        {column.getIsSorted() === "asc" ? " ▲" : column.getIsSorted() === "desc" ? " ▼" : ""}
      </button>
    ),
    enableGlobalFilter: false,
    filterFn: "inNumberRange",
    cell: (info) => (
      <EditableCell dealId={info.row.original.id} columnId="value" value={info.getValue()} />
    ),
  }),
  columnHelper.accessor("owner", {
    header: ({ column }) => (
      <button
        type="button"
        className={cn("flex items-center gap-1", column.getIsSorted() && "text-primary")}
        onClick={column.getToggleSortingHandler()}
      >
        Owner
        {column.getIsSorted() === "asc" ? " ▲" : column.getIsSorted() === "desc" ? " ▼" : ""}
      </button>
    ),
    enableGlobalFilter: false,
    filterFn: "equalsString",
    cell: (info) => (
      <EditableCell dealId={info.row.original.id} columnId="owner" value={info.getValue()} />
    ),
  }),
  columnHelper.accessor("closeDate", {
    header: ({ column }) => (
      <button
        type="button"
        className={cn("flex items-center gap-1", column.getIsSorted() && "text-primary")}
        onClick={column.getToggleSortingHandler()}
      >
        Close Date
        {column.getIsSorted() === "asc" ? " ▲" : column.getIsSorted() === "desc" ? " ▼" : ""}
      </button>
    ),
    enableGlobalFilter: false,
    filterFn: "inDateRange",
    cell: (info) => (
      <EditableCell dealId={info.row.original.id} columnId="closeDate" value={info.getValue()} />
    ),
  }),
  columnHelper.accessor("confidenceLevel", {
    header: "Confidence",
    enableGlobalFilter: false,
    cell: (info) => (
      <ConfidenceCell dealId={info.row.original.id} value={info.getValue()} />
    ),
  }),
  columnHelper.display({
    id: "lifetimeContractValue",
    header: "LTV",
    enableGlobalFilter: false,
    cell: (info) => currencyFormatter.format(computeLifetimeContractValue(info.row.original)),
  }),
  columnHelper.display({
    id: "stage",
    header: "Stage",
    enableGlobalFilter: false,
    cell: (info) => (
      <StageSelect dealId={info.row.original.id} currentGroup={toPipelineGroup(info.row.original)} />
    ),
  }),
  columnHelper.display({
    id: "documents",
    header: "Documents",
    enableGlobalFilter: false,
    cell: (info) => {
      const documents = info.row.original.documents;
      if (documents.length === 0) {
        return (
          <span className="rounded-full bg-background/80 px-2 py-0.5 text-xs font-medium text-muted-foreground">
            No assets
          </span>
        );
      }
      return (
        <div className="flex flex-wrap items-center gap-1">
          {documents.map((doc) => (
            <Button key={doc.id} asChild variant="outline" size="xs">
              <a
                href={doc.url}
                download={doc.fileName}
                title={doc.fileName}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                {doc.format.toUpperCase()}
              </a>
            </Button>
          ))}
        </div>
      );
    },
  }),
];

interface DealTableProps {
  deals: Deal[];
  group: PipelineGroup;
  globalFilter: string;
  columnFilters: ColumnFiltersState;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  onVisibleRowsChange?: (rows: Deal[]) => void;
}

/**
 * Headless @tanstack/react-table wrapper for a single pipeline group's rows.
 * Uses getCoreRowModel() only — no sorting/filtering/grouping row models
 * this phase (Phase 4, PIPE-05/06). Never renders getGroupedRowModel; each
 * GroupSection already owns its own pre-partitioned `deals` slice (see
 * usePipelineGroups / 01-RESEARCH.md Pattern 1).
 */
export function DealTable({
  deals,
  group,
  globalFilter,
  columnFilters,
  sorting,
  onSortingChange,
  onVisibleRowsChange,
}: DealTableProps) {
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
    enableGlobalFilter: false,
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
    state: { globalFilter, columnFilters, sorting },
    // No in-table search/filter UI exists on this component — globalFilter
    // and columnFilters only ever change via the shared PipelineToolbar
    // above. These no-ops keep TanStack treating both as controlled instead
    // of falling back to internal state (04-RESEARCH.md Pitfall 3).
    onGlobalFilterChange: () => {},
    onColumnFiltersChange: () => {},
    // Header clicks DO mutate sorting via column.getToggleSortingHandler(),
    // so this must be the real parent setter, not a no-op.
    onSortingChange,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: "includesString",
  });

  // Use table.getRowModel() (the final row model in whatever pipeline is
  // wired), not table.getFilteredRowModel() directly, so this effect stays
  // correct once Task 2/3 add column filters and sorting to the same
  // pipeline without needing to touch this effect again.
  useEffect(() => {
    onVisibleRowsChange?.(table.getRowModel().rows.map((row) => row.original));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table.getRowModel().rows]);

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
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td
                colSpan={tableColumns.length}
                className="px-4 py-6 text-center text-muted-foreground"
              >
                {group === "won" ? "No contracts yet." : "No deals in this group yet."}
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
                        deal={row.original}
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
