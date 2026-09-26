"use client";

import { useState } from "react";
import { CircleAlert, X } from "lucide-react";

import { Pagination } from "@/components/our/Pagination";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AnimalIdentification, SEX_ICON } from "@/features/animal/display";
import { cn } from "@/lib/utils";
import { TransferAnimal } from "./services";

const PAGE_SIZE = 10;
// Lotes listados por nome no resumo; os demais viram "+N".
const MAX_BATCHES_IN_SUMMARY = 4;

const defaultBatchOf = (a: TransferAnimal) =>
  a.currentBatch?.name ?? "Sem lote";

/** Paginação local da lista de animais selecionados. */
export function useSelectedPage(animals: TransferAnimal[]) {
  const [pageState, setPage] = useState(0);
  const pageCount = Math.ceil(animals.length / PAGE_SIZE);
  // Remover animais pode encolher a lista; não deixa a página ficar vazia.
  const page = Math.min(pageState, Math.max(pageCount - 1, 0));
  return {
    page,
    pageCount,
    setPage,
    pageAnimals: animals.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
  };
}

export type SelectedPage = ReturnType<typeof useSelectedPage>;

/** Resumo do grupo selecionado: quantidade, sexo, peso médio e lotes. */
export function SelectedAnimalsSummary({
  animals,
  batchOf = defaultBatchOf,
  className,
}: {
  animals: TransferAnimal[];
  batchOf?: (a: TransferAnimal) => string;
  className?: string;
}) {
  const box = cn(
    "rounded-md border border-border bg-muted/40 p-3 text-sm",
    className,
  );

  if (!animals.length) {
    return (
      <div className={cn(box, "flex items-center justify-center text-center")}>
        <span className="text-muted-foreground">
          Nenhum animal selecionado. Marque os animais na lista ao lado.
        </span>
      </div>
    );
  }

  const males = animals.filter((a) => a.sex === "MALE").length;
  const females = animals.length - males;
  const weights = animals
    .map((a) => a.currentWeightKg)
    .filter((w): w is number => w != null);
  const avgWeight = weights.length
    ? weights.reduce((sum, w) => sum + w, 0) / weights.length
    : null;

  const byBatch = new Map<string, number>();
  for (const a of animals) {
    const name = batchOf(a);
    byBatch.set(name, (byBatch.get(name) ?? 0) + 1);
  }
  const batches = [...byBatch.entries()].sort((a, b) => b[1] - a[1]);
  const shown = batches.slice(0, MAX_BATCHES_IN_SUMMARY);
  const hidden = batches.length - shown.length;

  return (
    <dl className={cn(box, "grid content-center gap-2")}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <dt className="sr-only">Animais</dt>
        <dd className="text-lg font-semibold tabular-nums">
          {animals.length} animal(is)
        </dd>
        <dd className="flex items-center gap-3 text-muted-foreground">
          <span className="flex items-center gap-1 tabular-nums">
            {SEX_ICON.MALE} {males}
          </span>
          <span className="flex items-center gap-1 tabular-nums">
            {SEX_ICON.FEMALE} {females}
          </span>
        </dd>
      </div>
      <div className="flex gap-2">
        <dt className="text-muted-foreground">Peso médio:</dt>
        <dd className="font-medium tabular-nums">
          {avgWeight != null
            ? `${avgWeight.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg`
            : "sem pesagem"}
          {avgWeight != null && weights.length < animals.length && (
            <span className="font-normal text-muted-foreground">
              {" "}
              ({weights.length} com peso)
            </span>
          )}
        </dd>
      </div>
      <div className="flex gap-2">
        <dt className="shrink-0 text-muted-foreground">Por lote:</dt>
        <dd>
          {shown.map(([name, count]) => `${name} ${count}`).join(" · ")}
          {hidden > 0 && (
            <span className="text-muted-foreground"> · +{hidden} lote(s)</span>
          )}
        </dd>
      </div>
    </dl>
  );
}

/** Tabela da página atual dos selecionados (ou o aviso de lista vazia). */
export function SelectedAnimalsTable({
  animals,
  pageAnimals,
  batchHeader = "Lote",
  batchOf = defaultBatchOf,
  isInvalid,
  invalidTitle,
  removeTitle,
  readOnly,
  onRemove,
  className,
}: {
  animals: TransferAnimal[];
  pageAnimals: TransferAnimal[];
  batchHeader?: string;
  batchOf?: (a: TransferAnimal) => string;
  /** Destaca animais que impedem o salvamento (ex.: inativos). */
  isInvalid?: (a: TransferAnimal) => boolean;
  invalidTitle?: string;
  removeTitle: string;
  readOnly: boolean;
  onRemove: (id: string) => void;
  className?: string;
}) {
  if (!animals.length) {
    return (
      <div
        className={cn(
          "flex min-h-40 items-center justify-center rounded-md border border-dashed border-border px-4 text-center text-sm text-muted-foreground",
          className,
        )}
      >
        Nenhum animal adicionado.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-border",
        className,
      )}
    >
      <Table className="[&_tr]:border-border">
        <TableHeader>
          <TableRow className="bg-muted">
            <TableHead className="text-muted-foreground">
              Identificação
            </TableHead>
            <TableHead className="text-muted-foreground">
              {batchHeader}
            </TableHead>
            <TableHead className="text-muted-foreground">Sexo</TableHead>
            <TableHead className="text-right text-muted-foreground">
              Peso
            </TableHead>
            {!readOnly && <TableHead className="w-10" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageAnimals.map((animal) => (
            <TableRow key={animal.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <AnimalIdentification animal={animal} />
                  {!readOnly && isInvalid?.(animal) && (
                    <span title={invalidTitle} className="text-destructive">
                      <CircleAlert className="size-4" />
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="max-w-32 truncate text-muted-foreground">
                {batchOf(animal)}
              </TableCell>
              <TableCell>{SEX_ICON[animal.sex] ?? animal.sex}</TableCell>
              <TableCell className="text-right tabular-nums">
                {animal.currentWeightKg != null
                  ? `${animal.currentWeightKg} kg`
                  : "—"}
              </TableCell>
              {!readOnly && (
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    title={removeTitle}
                    onClick={() => onRemove(animal.id)}
                  >
                    <X className="size-4" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function SelectedAnimalsPagination({
  animals,
  pagination,
  className,
}: {
  animals: TransferAnimal[];
  pagination: SelectedPage;
  className?: string;
}) {
  if (!animals.length) return null;
  return (
    <div className={className}>
      <Pagination
        pageIndex={pagination.page}
        pageCount={pagination.pageCount}
        pageSize={PAGE_SIZE}
        total={animals.length}
        onPageChange={pagination.setPage}
      />
    </div>
  );
}
