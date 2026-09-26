"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

type PaginationProps = {
  /** Página atual, a partir de 0. */
  pageIndex: number;
  pageCount: number;
  pageSize: number;
  /** Total de registros; sem ele, o texto "x–y de z" não aparece. */
  total?: number;
  onPageChange: (page: number) => void;
  /** Se informado, mostra o seletor de linhas por página (e volta para a primeira). */
  onPageSizeChange?: (size: number) => void;
};

// Até 7 páginas mostra todas; acima disso, primeira, vizinhas da atual e última.
function getPageButtons(currentPage: number, totalPages: number) {
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

/** Rodapé de paginação padrão das listas (usado pelo DataTable e demais listas). */
export function Pagination({
  pageIndex,
  pageCount,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const from = total ? pageIndex * pageSize + 1 : null;
  const to = total ? Math.min((pageIndex + 1) * pageSize, total) : null;

  return (
    <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
      {from && to && total ? (
        <span className="shrink-0">
          {from}–{to} de {total}
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
                onPageChange(0);
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
            type="button"
            variant="outline"
            size="icon-sm"
            title="Página anterior"
            onClick={() => onPageChange(pageIndex - 1)}
            disabled={pageIndex <= 0}
          >
            <ChevronLeft className="size-4" />
          </Button>

          {getPageButtons(pageIndex, pageCount).map((page, i) =>
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
                type="button"
                variant={page === pageIndex ? "default" : "outline"}
                size="icon-sm"
                onClick={() => onPageChange(page)}
              >
                {page + 1}
              </Button>
            ),
          )}

          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            title="Próxima página"
            onClick={() => onPageChange(pageIndex + 1)}
            disabled={pageIndex >= pageCount - 1}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
