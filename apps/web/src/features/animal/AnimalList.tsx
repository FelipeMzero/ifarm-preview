import { ColumnDef, VisibilityState } from "@tanstack/react-table";
import {
  IdCard,
  Pencil,
  Plus,
  Search,
  Settings2,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { CowHead } from "@/components/icons/cow-head";
import { useNavigate } from "react-router";

import React, { useEffect, useState } from "react";

import { ConfirmDialog } from "@/components/our/ConfirmDialog";
import { DataTable } from "@/components/our/DataTable";
import ListSkeleton from "@/components/our/ListSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  ActiveFilterChips,
  AnimalFiltersPopover,
  AnimalListFilters,
  countActiveFilters,
  filtersFromQuery,
  filtersToQuery,
  useFilterOptions,
} from "./AnimalFilters";
import { animalClient } from "@/lib/clients";
import { type AnimalRow, toAnimalListParams } from "@ifarm/shared";
import {
  AnimalIdentification,
  ORIGIN_VARIANT,
  SEX_ICON,
  STATUS_VARIANT,
} from "./display";
import AnimalDetails from "./AnimalDetails";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ANIMAL_ORIGIN_LABELS, ANIMAL_STATUS_LABELS } from "@ifarm/shared";
import { ErrorPage } from "@/components/our/ErrorPage";
import { useCurrentProperty } from "@/features/shell/CurrentPropertyProvider";

const DEFAULT_PAGE_SIZE = 10;

const COLUMN_LABELS: Record<string, string> = {
  sex: "Sexo",
  origin: "Origem",
  status: "Status",
  currentWeightKg: "Peso Atual",
  updatedAt: "Atualizado em",
};

function buildColumns(
  onRequestEdit: (id: string) => void,
  onRequestViewDetails: (id: string) => void,
  onRequestDelete: (id: string) => void,
): ColumnDef<AnimalRow>[] {
  return [
    {
      id: "identification",
      header: "Identificação",
      accessorFn: (row) => row.earTag ?? row.rfid ?? `ID ${row.code}`,
      cell: ({ row }) => <AnimalIdentification animal={row.original} />,
    },
    {
      header: "Sexo",
      accessorKey: "sex",
      cell: ({ row }) => SEX_ICON[row.original.sex] ?? row.original.sex,
    },
    {
      header: "Peso Atual",
      accessorKey: "currentWeightKg",
      cell: ({ row }) =>
        row.original.currentWeightKg != null
          ? `${row.original.currentWeightKg} kg`
          : "—",
    },
    {
      header: "Origem",
      accessorKey: "origin",
      cell: ({ row }) => (
        <Badge variant={ORIGIN_VARIANT[row.original.origin] ?? "outline"}>
          {ANIMAL_ORIGIN_LABELS[
            row.original.origin as keyof typeof ANIMAL_ORIGIN_LABELS
          ] ?? row.original.origin}
        </Badge>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => (
        <Badge variant={STATUS_VARIANT[row.original.status] ?? "outline"}>
          {ANIMAL_STATUS_LABELS[
            row.original.status as keyof typeof ANIMAL_STATUS_LABELS
          ] ?? row.original.status}
        </Badge>
      ),
    },
    {
      header: "Atualizado em",
      accessorKey: "updatedAt",
      cell: ({ row }) => {
        const iso = row.original.updatedAt;
        if (!iso) return "—";
        return new Date(iso).toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      },
    },
    {
      id: "actions",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            title="Editar"
            onClick={() => onRequestEdit(row.original.id)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            title="Detalhes"
            onClick={() => onRequestViewDetails(row.original.id)}
          >
            <IdCard className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            title="Excluir"
            className="text-destructive hover:text-destructive"
            onClick={() => onRequestDelete(row.original.id)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];
}

type QueryParams = Record<string, string | string[] | undefined>;

const firstParam = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v[0] : v) ?? "";

export default function AnimalList({
  initialQuery = {},
}: {
  /** Parâmetros da URL: busca e filtros sobrevivem ao recarregar/compartilhar. */
  initialQuery?: QueryParams;
}) {
  const navigate = useNavigate();
  const { property: currentProperty } = useCurrentProperty();
  const [animals, setAnimals] = useState<AnimalRow[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pageCount, setPageCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(() => firstParam(initialQuery.busca));
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [filters, setFilters] = useState<AnimalListFilters>(() =>
    filtersFromQuery(initialQuery),
  );
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const filterOptions = useFilterOptions(currentProperty?.id);
  const [loading, setLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    origin: false,
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [viewingDetailsId, setViewingDetailsId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPageIndex(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Os campos de peso são digitados: espera uma pausa antes de buscar.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedFilters(filters), 300);
    return () => clearTimeout(timer);
  }, [filters]);

  // Mantém busca e filtros na URL.
  useEffect(() => {
    const query = new URLSearchParams();
    if (debouncedSearch) query.set("busca", debouncedSearch);
    filtersToQuery(debouncedFilters, query);
    const qs = query.toString();
    navigate(`/animais${qs ? `?${qs}` : ""}`, {
      replace: true,
      preventScrollReset: true,
    });
  }, [debouncedSearch, debouncedFilters, navigate]);

  function handleFiltersChange(next: AnimalListFilters) {
    setFilters(next);
    setPageIndex(0);
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const result = await animalClient.getAnimals({
          ...toAnimalListParams({
            propertyId: currentProperty?.id,
            ...debouncedFilters,
          }),
          page: pageIndex,
          pageSize,
          search: debouncedSearch,
        });
        if (!cancelled) {
          setAnimals(result.data);
          setPageCount(result.pageCount);
          setTotal(result.total);
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setIsFirstLoad(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [
    pageIndex,
    pageSize,
    debouncedSearch,
    debouncedFilters,
    refreshKey,
    currentProperty?.id,
  ]);

  async function confirmDelete() {
    if (pendingDeleteId === null) return;
    try {
      await animalClient.deleteAnimal(pendingDeleteId);
      setRefreshKey((k) => k + 1);
    } catch {
      // erro silencioso
    } finally {
      setPendingDeleteId(null);
    }
  }

  const activeFilterCount = countActiveFilters(filters);

  const columns = buildColumns(
    (id) => navigate(`/animais/${id}`),
    setViewingDetailsId,
    setPendingDeleteId,
  );

  if (error) {
    return (
      <ErrorPage
        message={"Não foi possível obter os dados do servidor."}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (isFirstLoad) {
    return <ListSkeleton columns={6} />;
  }

  return (
    <div className="w-full max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Animais</h1>
        </div>
        <Button onClick={() => navigate("/animais/novo")}>
          <Plus className="size-4" /> Adicionar
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar por ID, brinco, RFID ou apelido..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        <AnimalFiltersPopover
          filters={filters}
          options={filterOptions}
          onChange={handleFiltersChange}
        >
          <Button variant="outline">
            <SlidersHorizontal className="size-4" />
            Filtros
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-primary px-1.5 text-[10px] font-semibold tabular-nums text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </AnimalFiltersPopover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Settings2 className="size-4" />
              Colunas
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Exibir colunas</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {Object.entries(COLUMN_LABELS).map(([key, label]) => (
              <DropdownMenuCheckboxItem
                key={key}
                checked={columnVisibility[key] !== false}
                onCheckedChange={(checked) =>
                  setColumnVisibility((prev) => ({ ...prev, [key]: checked }))
                }
              >
                {label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ActiveFilterChips
        filters={filters}
        options={filterOptions}
        onChange={handleFiltersChange}
      />

      <div
        className={
          loading ? "opacity-60 transition-opacity" : "transition-opacity"
        }
      >
        {animals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
            <CowHead size={50} className="opacity-30" />
            <p className="text-2xl">Nenhum animal encontrado.</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={animals}
            pageCount={pageCount}
            pageIndex={pageIndex}
            pageSize={pageSize}
            total={total}
            initialSorting={[{ id: "updatedAt", desc: true }]}
            onPageChange={setPageIndex}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPageIndex(0);
            }}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
          />
        )}
      </div>

      <Dialog
        open={viewingDetailsId !== null}
        onOpenChange={(open) => {
          if (!open) setViewingDetailsId(null);
        }}
      >
        <DialogContent className="p-8 sm:max-w-5xl h-[90vh] content-start overflow-y-auto">
          {viewingDetailsId && (
            <AnimalDetails
              id={viewingDetailsId}
              onClose={() => {
                setViewingDetailsId(null);
                setRefreshKey((k) => k + 1);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null);
        }}
        onConfirm={confirmDelete}
        description="Esta ação não pode ser desfeita. O registro será removido permanentemente."
      />
    </div>
  );
}
