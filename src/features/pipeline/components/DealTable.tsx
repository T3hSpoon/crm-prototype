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
import { format, parseISO } from "date-fns";
import type { Deal } from "@/shared/types/deal";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const columnHelper = legacyCreateColumnHelper<Deal>();

const columns = [
  columnHelper.accessor("name", {
    header: "Name",
  }),
  columnHelper.accessor("company", {
    header: "Company",
  }),
  columnHelper.accessor("value", {
    header: "Value",
    cell: (info) => currencyFormatter.format(info.getValue()),
  }),
  columnHelper.accessor("owner", {
    header: "Owner",
  }),
  columnHelper.accessor("closeDate", {
    header: "Close Date",
    cell: (info) => format(parseISO(info.getValue()), "MMM d, yyyy"),
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
  const table = useLegacyTable({
    data: deals,
    columns,
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
                colSpan={columns.length}
                className="px-4 py-6 text-center text-muted-foreground"
              >
                No deals in this group yet.
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t border-border">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
