import {
  ColumnDef,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { useState } from "react";

import { Pagination } from "@/components/our/Pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageSize?: number;
  pageCount?: number;
  pageIndex?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: (visibility: VisibilityState) => void;
  initialSorting?: SortingState;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageSize = 10,
  pageCount,
  pageIndex = 0,
  total,
  onPageChange,
  onPageSizeChange,
  columnVisibility,
  onColumnVisibilityChange,
  initialSorting = [],
}: DataTableProps<TData, TValue>) {
  "use no memo";
  const [sorting, setSorting] = useState<SortingState>(initialSorting);

  const isServerSide = pageCount !== undefined;

  // O TanStack Table não é compatível com o React Compiler (por isso o "use no memo"
  // acima); não há API alternativa, então o aviso é desligado só aqui.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    ...(isServerSide
      ? { pageCount, manualPagination: true }
      : { initialState: { pagination: { pageSize } } }),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    ...(!isServerSide && { getPaginationRowModel: getPaginationRowModel() }),
    onSortingChange: setSorting,
    onColumnVisibilityChange: (updater) => {
      const next =
        typeof updater === "function"
          ? updater(columnVisibility ?? {})
          : updater;
      onColumnVisibilityChange?.(next);
    },
    state: {
      sorting,
      ...(columnVisibility !== undefined && { columnVisibility }),
      ...(isServerSide && { pagination: { pageIndex, pageSize } }),
    },
  });

  const currentPage = isServerSide
    ? pageIndex
    : table.getState().pagination.pageIndex;
  const totalPages = isServerSide ? pageCount : table.getPageCount();

  function handlePageClick(page: number) {
    if (isServerSide) onPageChange?.(page);
    else table.setPageIndex(page);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md bg-card border border-border overflow-hidden">
        <Table className="[&_tr]:border-border">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button
                        onClick={header.column.getToggleSortingHandler()}
                        className="flex items-center gap-1 text-muted-foreground hover:text-accent-foreground transition-colors"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {header.column.getIsSorted() === "asc" ? (
                          <ChevronUp className="size-4" />
                        ) : header.column.getIsSorted() === "desc" ? (
                          <ChevronDown className="size-4" />
                        ) : (
                          <ChevronsUpDown className="size-4 opacity-40" />
                        )}
                      </button>
                    ) : (
                      <span className="text-muted-foreground">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </span>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-accent/40"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  Nenhum resultado encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination
        pageIndex={currentPage}
        pageCount={totalPages}
        pageSize={pageSize}
        total={total}
        onPageChange={handlePageClick}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}
