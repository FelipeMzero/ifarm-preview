"use client";

import { useEffect, useMemo, useState } from "react";
import { ListPlus, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import { Pagination } from "@/components/our/Pagination";
import { SelectField, SelectFieldItem } from "@/components/our/SelectField";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { animalClient } from "@/lib/clients";
import { type AnimalRow } from "@ifarm/shared";
import { batchClient } from "@/lib/clients";
import { AnimalIdentification, SEX_ICON } from "@/features/animal/display";
import {
  blockingReason,
  type CommitmentExclusion,
  type CommitmentIntent,
} from "@ifarm/shared";
import { SEX_ITEMS } from "@ifarm/shared";
import { cn } from "@/lib/utils";
import { type TransferAnimal } from "@ifarm/shared";

const PAGE_SIZE = 10;
// Limite de segurança para "adicionar todos os filtrados".
const ADD_ALL_LIMIT = 2000;

export function toTransferAnimal(a: AnimalRow): TransferAnimal {
  return {
    id: a.id,
    code: a.code,
    earTag: a.earTag,
    rfid: a.rfid,
    name: a.name,
    sex: a.sex,
    status: a.status,
    currentWeightKg: a.currentWeightKg,
    currentBatch: a.currentBatch,
  };
}

type AnimalPickerOptions = {
  propertyId?: string;
  // Animais que já estão no destino não aparecem para seleção.
  destinationBatchId: string;
  /** Lote pré-selecionado no filtro (ex.: esvaziar um lote antes de encerrá-lo). */
  initialBatchFilter?: string;
  selectedIds: Set<string>;
  onAdd: (animals: TransferAnimal[]) => void;
  onRemove: (ids: string[]) => void;
  /**
   * O que se vai fazer com os animais: os que têm operação em aberto conflitante
   * aparecem desabilitados, com o motivo (ver lib/animal-commitments).
   */
  intent?: CommitmentIntent;
  /** A operação sendo editada, que não conta como conflito. */
  exclude?: CommitmentExclusion;
};

// Motivo de indisponibilidade de cada animal (só os indisponíveis).
async function unavailableAnimals(
  animalIds: string[],
  intent: CommitmentIntent | undefined,
  exclude: CommitmentExclusion | undefined,
) {
  const reasons = new Map<string, string>();
  if (!intent) return reasons;
  const commitments = await animalClient.getCommitmentsFor(animalIds, exclude);
  for (const [id, list] of Object.entries(commitments)) {
    const reason = blockingReason(list, intent);
    if (reason) reasons.set(id, reason);
  }
  return reasons;
}

/**
 * Estado e busca do seletor de animais. As partes (filtros, tabela e paginação) são
 * componentes separados para que a tela possa posicioná-las numa grade, alinhadas com
 * outros blocos; o AnimalPicker abaixo as monta empilhadas.
 */
export function useAnimalPicker({
  propertyId,
  destinationBatchId,
  initialBatchFilter,
  selectedIds,
  onAdd,
  onRemove,
  intent,
  exclude,
}: AnimalPickerOptions) {
  const [search, setSearch] = useState("");
  const [sex, setSex] = useState("");
  const [batchFilter, setBatchFilter] = useState(initialBatchFilter ?? "");
  const [batchItems, setBatchItems] = useState<SelectFieldItem[]>([]);
  const [minWeight, setMinWeight] = useState("");
  const [maxWeight, setMaxWeight] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    minWeight: "",
    maxWeight: "",
  });
  const [page, setPage] = useState(0);
  const [animals, setAnimals] = useState<AnimalRow[]>([]);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [addingAll, setAddingAll] = useState(false);
  const [unavailable, setUnavailable] = useState<Map<string, string>>(
    new Map(),
  );
  // Serializados para as buscas não dispararem a cada render por causa de um objeto
  // novo (ex.: as etapas do planejamento ainda sendo editadas).
  const intentKey = JSON.stringify(intent ?? null);
  const excludeKey = JSON.stringify(exclude ?? {});

  // Texto e faixa de peso só disparam a busca depois de uma pausa na digitação.
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters({ search, minWeight, maxWeight });
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, minWeight, maxWeight]);

  useEffect(() => {
    let cancelled = false;

    batchClient
      .getBatches({ propertyId, status: "active", pageSize: 100 })
      .then((result) => {
        if (!cancelled)
          setBatchItems(
            result.data.map((b) => ({ value: b.id, label: b.name })),
          );
      })
      .catch(() => {
        if (!cancelled) setBatchItems([]);
      });

    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  // O filtro de lote não pode apontar para o destino (a lista viria sempre vazia).
  const originFilter = batchFilter === destinationBatchId ? "" : batchFilter;

  const query = useMemo(
    () => ({
      propertyId,
      batchId: originFilter,
      excludeBatchId: destinationBatchId,
      status: "ACTIVE",
      sex,
      ...filters,
    }),
    [propertyId, originFilter, destinationBatchId, sex, filters],
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const result = await animalClient.getAnimals({
          ...query,
          page,
          pageSize: PAGE_SIZE,
        });
        if (cancelled) return;
        // Trocar o destino pode encolher o resultado; volta para a primeira página.
        if (page > 0 && page >= result.pageCount) {
          setPage(0);
          return;
        }
        const reasons = await unavailableAnimals(
          result.data.map((a) => a.id),
          JSON.parse(intentKey) ?? undefined,
          JSON.parse(excludeKey),
        );
        if (cancelled) return;
        setUnavailable(reasons);
        setAnimals(result.data);
        setTotal(result.total);
        setPageCount(result.pageCount);
      } catch {
        if (!cancelled) toast.error("Não foi possível buscar os animais.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [query, page, intentKey, excludeKey]);

  async function addAll() {
    setAddingAll(true);
    try {
      const result = await animalClient.getAnimals({
        ...query,
        page: 0,
        pageSize: ADD_ALL_LIMIT,
      });
      const reasons = await unavailableAnimals(
        result.data.map((a) => a.id),
        intent,
        exclude,
      );
      const toAdd = result.data
        .filter((a) => !selectedIds.has(a.id) && !reasons.has(a.id))
        .map(toTransferAnimal);
      onAdd(toAdd);
      toast.success(
        toAdd.length
          ? `${toAdd.length} animal(is) adicionado(s).`
          : "Todos os animais filtrados disponíveis já estão na seleção.",
      );
      const skipped = result.data.filter((a) => reasons.has(a.id)).length;
      if (skipped) {
        toast.warning(
          `${skipped} animal(is) ficaram de fora por estarem em outra operação em aberto.`,
        );
      }
      if (result.total > ADD_ALL_LIMIT) {
        toast.warning(
          `Apenas os primeiros ${ADD_ALL_LIMIT} resultados foram considerados. Refine os filtros.`,
        );
      }
    } catch {
      toast.error("Não foi possível adicionar os animais filtrados.");
    } finally {
      setAddingAll(false);
    }
  }

  // A seleção da página inteira ignora os indisponíveis (mas desmarca os que já
  // estavam selecionados).
  const selectable = animals.filter((a) => !unavailable.has(a.id));
  const pageSelectedCount = selectable.filter((a) =>
    selectedIds.has(a.id),
  ).length;
  const allPageSelected =
    selectable.length > 0 && pageSelectedCount === selectable.length;
  const headerChecked: boolean | "indeterminate" = allPageSelected
    ? true
    : pageSelectedCount > 0
      ? "indeterminate"
      : false;

  function togglePage() {
    if (allPageSelected) {
      onRemove(animals.map((a) => a.id));
    } else {
      onAdd(
        selectable.filter((a) => !selectedIds.has(a.id)).map(toTransferAnimal),
      );
    }
  }

  function toggleAnimal(animal: AnimalRow, checked: boolean) {
    if (checked) {
      if (!unavailable.has(animal.id)) onAdd([toTransferAnimal(animal)]);
    } else onRemove([animal.id]);
  }

  return {
    destinationBatchId,
    selectedIds,
    search,
    setSearch,
    sex,
    setSex,
    originFilter,
    setBatchFilter,
    batchItems,
    minWeight,
    setMinWeight,
    maxWeight,
    setMaxWeight,
    page,
    setPage,
    animals,
    unavailable,
    total,
    pageCount,
    loading,
    addingAll,
    addAll,
    headerChecked,
    togglePage,
    toggleAnimal,
  };
}

export type AnimalPickerState = ReturnType<typeof useAnimalPicker>;

type PartProps = { picker: AnimalPickerState; className?: string };

/** Busca, filtros, total encontrado e "Adicionar todos". */
export function AnimalPickerFilters({ picker: p, className }: PartProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="relative sm:col-span-2">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID, brinco, RFID ou apelido..."
            value={p.search}
            onChange={(e) => p.setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <SelectField
          value={p.originFilter}
          onValueChange={(val) => {
            p.setBatchFilter(val);
            p.setPage(0);
          }}
          items={[
            { value: "", label: "Todos os lotes" },
            ...p.batchItems.filter((b) => b.value !== p.destinationBatchId),
          ]}
          className="w-full"
        />
        <SelectField
          value={p.sex}
          onValueChange={(val) => {
            p.setSex(val);
            p.setPage(0);
          }}
          items={[{ value: "", label: "Ambos os sexos" }, ...SEX_ITEMS]}
          className="w-full"
        />
        <div className="flex items-center gap-2 sm:col-span-2">
          <Input
            type="number"
            min={0}
            step="any"
            placeholder="Peso mín. (kg)"
            value={p.minWeight}
            onChange={(e) => p.setMinWeight(e.target.value)}
          />
          <Input
            type="number"
            min={0}
            step="any"
            placeholder="Peso máx. (kg)"
            value={p.maxWeight}
            onChange={(e) => p.setMaxWeight(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>
          {p.total} animal(is) encontrado(s)
          {p.loading && (
            <Loader2 className="ml-2 inline size-3.5 animate-spin" />
          )}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={p.total === 0 || p.addingAll}
          onClick={p.addAll}
        >
          {p.addingAll ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ListPlus className="size-4" />
          )}
          Adicionar todos ({p.total})
        </Button>
      </div>
    </div>
  );
}

/** Tabela da página atual, com seleção por linha e da página inteira. */
export function AnimalPickerTable({ picker: p, className }: PartProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-border transition-opacity",
        p.loading && "opacity-60",
        className,
      )}
    >
      <Table className="[&_tr]:border-border">
        <TableHeader>
          <TableRow className="bg-muted">
            <TableHead className="w-10">
              <Checkbox
                checked={p.headerChecked}
                onCheckedChange={p.togglePage}
                disabled={p.animals.every((a) => p.unavailable.has(a.id))}
                aria-label="Selecionar animais da página"
              />
            </TableHead>
            <TableHead className="text-muted-foreground">
              Identificação
            </TableHead>
            <TableHead className="text-muted-foreground">Lote</TableHead>
            <TableHead className="text-muted-foreground">Sexo</TableHead>
            <TableHead className="text-right text-muted-foreground">
              Peso
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {p.animals.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="h-24 text-center text-muted-foreground"
              >
                Nenhum animal encontrado.
              </TableCell>
            </TableRow>
          ) : (
            p.animals.map((animal) => {
              const checked = p.selectedIds.has(animal.id);
              const reason = p.unavailable.get(animal.id);
              // Indisponível e fora da seleção: não há o que fazer na linha.
              const locked = !!reason && !checked;
              return (
                <TableRow
                  key={animal.id}
                  data-state={checked ? "selected" : undefined}
                  className={cn(
                    locked
                      ? "cursor-not-allowed opacity-60"
                      : "cursor-pointer hover:bg-accent/40",
                  )}
                  onClick={() => !locked && p.toggleAnimal(animal, !checked)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={checked}
                      disabled={locked}
                      onCheckedChange={(value) =>
                        p.toggleAnimal(animal, value === true)
                      }
                      aria-label="Selecionar animal"
                    />
                  </TableCell>
                  <TableCell>
                    <AnimalIdentification animal={animal} />
                    {reason && (
                      <p
                        className="mt-0.5 max-w-64 truncate text-xs text-warning"
                        title={`Em ${reason}`}
                      >
                        Em {reason}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="max-w-32 truncate text-muted-foreground">
                    {animal.currentBatch?.name ?? "Sem lote"}
                  </TableCell>
                  <TableCell>{SEX_ICON[animal.sex] ?? animal.sex}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {animal.currentWeightKg != null
                      ? `${animal.currentWeightKg} kg`
                      : "—"}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export function AnimalPickerPagination({ picker: p, className }: PartProps) {
  if (p.total === 0) return null;
  return (
    <div className={className}>
      <Pagination
        pageIndex={p.page}
        pageCount={p.pageCount}
        pageSize={PAGE_SIZE}
        total={p.total}
        onPageChange={p.setPage}
      />
    </div>
  );
}

/** Seletor completo (filtros, tabela e paginação empilhados). */
export function AnimalPicker(props: AnimalPickerOptions) {
  const picker = useAnimalPicker(props);
  return (
    <div className="space-y-3">
      <AnimalPickerFilters picker={picker} />
      <AnimalPickerTable picker={picker} />
      <AnimalPickerPagination picker={picker} />
    </div>
  );
}
