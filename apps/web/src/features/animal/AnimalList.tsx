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
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useEffect, useState } from "react";

import { ConfirmDialog } from "@/components/our/ConfirmDialog";
import { DataTable } from "@/components/our/DataTable";
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
import {
  type AnimalListParams,
  type AnimalRow,
  toAnimalListParams,
  formatDateTime,
} from "@ifarm/shared";
import {
  AnimalIdentification,
  ORIGIN_VARIANT,
  SEX_ICON,
  STATUS_VARIANT,
} from "./display";
import { AnimalDetails } from "./AnimalDetails";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ANIMAL_ORIGIN_LABELS, ANIMAL_STATUS_LABELS } from "@ifarm/shared";
import { ErrorPage } from "@/components/our/ErrorPage";
import { useCurrentProperty } from "@/features/shell/useCurrentProperty";
import { ListSkeleton } from "@/components/our/PageSkeletons";
import { useLocalStorageState } from "@/hooks/use-local-storage-state";
import { animalKeys, animalListQuery } from "./queries";

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
      cell: ({ row }) => formatDateTime(row.original.updatedAt),
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

// Página e itens por página na URL (busca e filtros: filtersFromQuery / filtersToQuery).
const PAGE_DEFAULTS = { pagina: "1", itens: String(DEFAULT_PAGE_SIZE) };
type PageParam = keyof typeof PAGE_DEFAULTS;

function readPage(searchParams: URLSearchParams) {
  const positive = (key: PageParam) => {
    const n = Number(searchParams.get(key) ?? PAGE_DEFAULTS[key]);
    return Number.isInteger(n) && n > 0 ? n : Number(PAGE_DEFAULTS[key]);
  };
  return {
    pageIndex: positive("pagina") - 1,
    pageSize: Math.min(positive("itens"), 100),
  };
}

export function AnimalList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { property: currentProperty, isLoading: isPropertyLoading } =
    useCurrentProperty();
  const [searchParams, setSearchParams] = useSearchParams();
  const { pageIndex, pageSize } = readPage(searchParams);
  const urlSearch = searchParams.get("busca") ?? "";
  const urlFilters = filtersFromQuery(searchParams);

  // Atualiza a URL (sem criar entrada no histórico a cada mudança de filtro).
  function updateUrl(update: (next: URLSearchParams) => void) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        update(next);
        return next;
      },
      { replace: true, preventScrollReset: true },
    );
  }
  function setPageParam(key: PageParam, value: number) {
    updateUrl((next) => {
      if (key === "itens") next.delete("pagina");
      if (String(value) === PAGE_DEFAULTS[key]) next.delete(key);
      else next.set(key, String(value));
    });
  }

  // A busca e os filtros digitados ficam aqui e vão para a URL depois de uma pausa (os campos
  // de peso também são digitados), voltando à primeira página. Se a URL mudar por fora
  // (voltar/avançar do navegador), os campos acompanham.
  const urlKey = JSON.stringify([urlSearch, urlFilters]);
  const [search, setSearch] = useState(urlSearch);
  const [filters, setFilters] = useState<AnimalListFilters>(urlFilters);
  const [syncedUrlKey, setSyncedUrlKey] = useState(urlKey);
  if (syncedUrlKey !== urlKey) {
    setSyncedUrlKey(urlKey);
    setSearch(urlSearch);
    setFilters(urlFilters);
  }
  // Colunas visíveis: preferência lembrada neste navegador.
  const [columnVisibility, setColumnVisibility] =
    useLocalStorageState<VisibilityState>("animais:colunas", {
      origin: false,
    });
  const filterOptions = useFilterOptions(currentProperty?.id);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [viewingDetailsId, setViewingDetailsId] = useState<string | null>(null);

  useEffect(() => {
    if (JSON.stringify([search, filters]) === urlKey) return;
    const timer = setTimeout(
      () =>
        updateUrl((next) => {
          for (const key of [...next.keys()]) {
            if (key !== "itens") next.delete(key);
          }
          if (search) next.set("busca", search);
          filtersToQuery(filters, next);
        }),
      300,
    );
    return () => clearTimeout(timer);
  });

  const params: AnimalListParams = {
    ...toAnimalListParams({ propertyId: currentProperty?.id, ...urlFilters }),
    page: pageIndex,
    pageSize,
    search: urlSearch,
  };
  // Ao trocar de página ou de filtro, a lista anterior fica na tela (esmaecida) até chegar a
  // nova (keepPreviousData). Sem a propriedade atual, a busca traria animais de todas.
  const { data, isPending, isPlaceholderData, refetch } = useQuery({
    ...animalListQuery(params),
    enabled: !isPropertyLoading,
    placeholderData: keepPreviousData,
  });
  const animals: AnimalRow[] = data?.data ?? [];

  const reloadAnimals = () =>
    queryClient.invalidateQueries({ queryKey: animalKeys.all });

  const deleteAnimal = useMutation({
    mutationFn: (id: string) => animalClient.deleteAnimal(id),
    onSuccess: () => {
      toast.success("Registro excluído com sucesso!");
      reloadAnimals();
    },
    // O diálogo já fechou no clique (AlertDialogAction); o aviso explica a falha.
    onError: (e) => {
      toast.error(e.message || "Não foi possível excluir o animal.");
    },
    onSettled: () => setPendingDeleteId(null),
  });

  function confirmDelete() {
    if (pendingDeleteId) deleteAnimal.mutate(pendingDeleteId);
  }

  const activeFilterCount = countActiveFilters(filters);

  const columns = buildColumns(
    (id) => navigate(`/animais/${id}`),
    setViewingDetailsId,
    setPendingDeleteId,
  );

  if (isPending) {
    return <ListSkeleton columns={6} />;
  }

  if (!data) {
    return (
      <ErrorPage
        message={"Não foi possível obter os dados do servidor."}
        onRetry={() => refetch()}
      />
    );
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
          onChange={setFilters}
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
        onChange={setFilters}
      />

      {/* Enquanto mostra a lista anterior (troca de filtro ou de página), fica esmaecida e sem
          cliques, para ninguém agir sobre linhas que vão sair; a atualização em segundo plano,
          ao voltar para a lista, não esmaece. */}
      <div
        aria-busy={isPlaceholderData}
        className={
          isPlaceholderData
            ? "pointer-events-none opacity-60 transition-opacity"
            : "transition-opacity"
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
            pageCount={data.pageCount}
            pageIndex={pageIndex}
            pageSize={pageSize}
            total={data.total}
            initialSorting={[{ id: "updatedAt", desc: true }]}
            onPageChange={(index) => setPageParam("pagina", index + 1)}
            onPageSizeChange={(size) => setPageParam("itens", size)}
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
                reloadAnimals();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) =>
          !open && !deleteAnimal.isPending && setPendingDeleteId(null)
        }
        onConfirm={confirmDelete}
        description="Esta ação não pode ser desfeita. O registro será removido permanentemente."
      />
    </div>
  );
}
