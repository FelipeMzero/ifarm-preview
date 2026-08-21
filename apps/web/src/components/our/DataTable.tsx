"use client";

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
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  MoreHorizontal,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

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
  const canPrevious = currentPage > 0;
  const canNext = currentPage < totalPages - 1;

  const from = total ? currentPage * pageSize + 1 : null;
  const to = total ? Math.min((currentPage + 1) * pageSize, total) : null;

  function handlePrevious() {
    if (isServerSide) onPageChange?.(currentPage - 1);
    else table.previousPage();
  }

  function handleNext() {
    if (isServerSide) onPageChange?.(currentPage + 1);
    else table.nextPage();
  }

  function handlePageClick(page: number) {
    if (isServerSide) onPageChange?.(page);
    else table.setPageIndex(page);
  }

  function getPageButtons() {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }
    const pages: (number | "...")[] = [];
    const firstInner = Math.max(1, currentPage - 1);
    const lastInner = Math.min(totalPages - 2, currentPage + 1);

    pages.push(0);
    if (firstInner > 1) pages.push("...");
    for (let i = firstInner; i <= lastInner; i++) pages.push(i);
    if (lastInner < totalPages - 2) pages.push("...");
    pages.push(totalPages - 1);
    return pages;
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

      <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
        {from && to && total ? (
          <span className="shrink-0">
            Mostrando {from}–{to} de {total} registros
          </span>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-2">
          {onPageSizeChange && (
            <div className="flex items-center gap-1.5">
              <span className="shrink-0">Linhas</span>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  onPageSizeChange(Number(v));
                  onPageChange?.(0);
                }}
              >
                <SelectTrigger className="h-8 w-16">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={handlePrevious}
              disabled={!canPrevious}
            >
              <ChevronLeft className="size-4" />
            </Button>

            {getPageButtons().map((page, i) =>
              page === "..." ? (
                <span
                  key={`ellipsis-${i}`}
                  className="flex size-7 items-center justify-center"
                >
                  <MoreHorizontal className="size-4" />
                </span>
              ) : (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="icon-sm"
                  onClick={() => handlePageClick(page)}
                >
                  {page + 1}
                </Button>
              ),
            )}

            <Button
              variant="outline"
              size="icon-sm"
              onClick={handleNext}
              disabled={!canNext}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
