import { ColumnDef, VisibilityState } from "@tanstack/react-table";
import {
  ArrowRightLeft,
  Archive,
  IdCard,
  Pencil,
  Plus,
  Search,
  Settings2,
  PackageOpen,
  RotateCcw,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { DataTable } from "@/components/our/DataTable";
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
import { SelectField } from "@/components/our/SelectField";
import { batchClient } from "@/lib/clients";
import {
  BatchCloseError,
  type BatchRow,
  type BatchListParams,
  formatDateTime,
} from "@ifarm/shared";
import { ConfirmDialog } from "@/components/our/ConfirmDialog";
import { ErrorPage } from "@/components/our/ErrorPage";
import { useCurrentProperty } from "@/features/shell/useCurrentProperty";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BatchDetails } from "./BatchDetails";
import { BatchReopenDialog } from "./BatchReopenDialog";
import { ListSkeleton } from "@/components/our/PageSkeletons";
import { useLocalStorageState } from "@/hooks/use-local-storage-state";
import { batchKeys, batchListQuery } from "./queries";

const DEFAULT_PAGE_SIZE = 10;

const STATUS_FILTER = {
  ALL: "todos",
  ACTIVE: "vigente",
  INACTIVE: "encerrado",
} as const;
type StatusFilter = (typeof STATUS_FILTER)[keyof typeof STATUS_FILTER];

const STATUS_BY_FILTER: Record<StatusFilter, BatchListParams["status"]> = {
  todos: undefined,
  vigente: "active",
  encerrado: "inactive",
};

const URL_DEFAULTS = {
  busca: "",
  situacao: STATUS_FILTER.ACTIVE as string,
  pagina: "1",
  itens: String(DEFAULT_PAGE_SIZE),
};
type UrlParam = keyof typeof URL_DEFAULTS;

function readFilters(searchParams: URLSearchParams) {
  const get = (key: UrlParam) => searchParams.get(key) ?? URL_DEFAULTS[key];
  const situacao = get("situacao");
  const filter = (
    situacao in STATUS_BY_FILTER ? situacao : STATUS_FILTER.ACTIVE
  ) as StatusFilter;
  const positive = (key: UrlParam) => {
    const n = Number(get(key));
    return Number.isInteger(n) && n > 0 ? n : Number(URL_DEFAULTS[key]);
  };
  return {
    search: get("busca"),
    filter,
    pageIndex: positive("pagina") - 1,
    pageSize: Math.min(positive("itens"), 100),
  };
}

const COLUMN_LABELS: Record<string, string> = {
  area: "Área",
  animalCount: "Animais",
  avgWeightKg: "Peso Médio",
  updatedAt: "Atualizado em",
};

function buildColumns(
  onRequestEdit: (id: string) => void,
  onRequestViewDetails: (id: string) => void,
  onRequestClose: (row: BatchRow) => void,
  onRequestReopen: (row: BatchRow) => void,
): ColumnDef<BatchRow>[] {
  return [
    {
      header: "Nome",
      accessorKey: "name",
      cell: ({ row }) => row.original.name ?? "—",
    },
    {
      header: "Área",
      accessorKey: "area",
      cell: ({ row }) => row.original.area?.name ?? "—",
    },
    {
      header: "Animais",
      accessorKey: "animalCount",
      cell: ({ row }) => row.original.animalCount,
    },
    {
      header: "Peso Médio",
      accessorKey: "avgWeightKg",
      cell: ({ row }) =>
        row.original.avgWeightKg != null
          ? `${row.original.avgWeightKg.toFixed(1)} kg`
          : "—",
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
          {row.original.closedAt ? (
            <Button
              variant="ghost"
              size="icon-sm"
              title="Reativar lote"
              onClick={() => onRequestReopen(row.original)}
            >
              <RotateCcw className="size-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon-sm"
              title="Encerrar lote"
              onClick={() => onRequestClose(row.original)}
            >
              <Archive className="size-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];
}

export function BatchList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { property: currentProperty, isLoading: isPropertyLoading } =
    useCurrentProperty();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    search: debouncedSearch,
    filter,
    pageIndex,
    pageSize,
  } = readFilters(searchParams);

  // Atualiza a URL (sem criar entrada no histórico a cada mudança de filtro).
  function updateUrl(changes: Partial<Record<UrlParam, string | number>>) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(changes)) {
          const text = String(value);
          if (text === URL_DEFAULTS[key as UrlParam]) next.delete(key);
          else next.set(key, text);
        }
        return next;
      },
      { replace: true, preventScrollReset: true },
    );
  }
  const setPageIndex = (index: number) => updateUrl({ pagina: index + 1 });

  // O texto digitado fica aqui e vai para a URL depois de uma pausa. Se a URL mudar por fora
  // (voltar/avançar do navegador), o campo acompanha.
  const [search, setSearch] = useState(debouncedSearch);
  const [urlSearch, setUrlSearch] = useState(debouncedSearch);
  if (urlSearch !== debouncedSearch) {
    setUrlSearch(debouncedSearch);
    setSearch(debouncedSearch);
  }
  // Colunas visíveis: preferência lembrada neste navegador.
  const [columnVisibility, setColumnVisibility] =
    useLocalStorageState<VisibilityState>("lotes:colunas", {});
  const [viewingDetailsId, setViewingDetailsId] = useState<string | null>(null);
  const [closingBatch, setClosingBatch] = useState<BatchRow | null>(null);
  const [reopeningBatch, setReopeningBatch] = useState<BatchRow | null>(null);
  // Lote que não pôde ser encerrado por ainda ter animais.
  const [batchWithAnimals, setBatchWithAnimals] = useState<{
    row: BatchRow;
    animalCount: number;
  } | null>(null);

  useEffect(() => {
    if (search === debouncedSearch) return;
    const timer = setTimeout(
      () => updateUrl({ busca: search, pagina: 1 }),
      300,
    );
    return () => clearTimeout(timer);
  });

  const params: BatchListParams = {
    propertyId: currentProperty?.id,
    page: pageIndex,
    pageSize,
    search: debouncedSearch,
    status: STATUS_BY_FILTER[filter],
  };
  // Ao trocar de página ou de filtro, a lista anterior fica na tela (esmaecida) até chegar a
  // nova (keepPreviousData). Sem a propriedade atual, a busca traria lotes de todas.
  const { data, isPending, isPlaceholderData, refetch } = useQuery({
    ...batchListQuery(params),
    enabled: !isPropertyLoading,
    placeholderData: keepPreviousData,
  });
  const batches: BatchRow[] = data?.data ?? [];

  function requestClose(row: BatchRow) {
    // A contagem da listagem já indica animais; o servidor confirma na hora de encerrar.
    if (row.animalCount > 0) {
      setBatchWithAnimals({ row, animalCount: row.animalCount });
    } else {
      setClosingBatch(row);
    }
  }

  const closeBatch = useMutation({
    mutationFn: (row: BatchRow) => batchClient.closeBatch(row.id),
    onSuccess: (_, row) => {
      toast.success(`Lote "${row.name}" encerrado.`);
      queryClient.invalidateQueries({ queryKey: batchKeys.all });
    },
    // O diálogo já fechou no clique (AlertDialogAction). Se ainda há animais (alguém pôs
    // depois da listagem), explica e oferece a transferência.
    onError: (e, row) => {
      if (e instanceof BatchCloseError && e.code === "HAS_ANIMALS") {
        setBatchWithAnimals({ row, animalCount: e.animalCount ?? 0 });
      } else {
        toast.error(e.message || "Não foi possível encerrar o lote.");
      }
    },
  });

  function confirmClose() {
    if (closingBatch) closeBatch.mutate(closingBatch);
    setClosingBatch(null);
  }

  const columns = buildColumns(
    (id) => navigate(`/lotes/${id}`),
    setViewingDetailsId,
    requestClose,
    setReopeningBatch,
  );

  if (isPending) {
    return <ListSkeleton columns={5} />;
  }

  if (!data) {
    return (
      <ErrorPage
        message="Não foi possível obter os dados do servidor."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="w-full max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Lotes</h1>
        </div>
        <Button onClick={() => navigate("/lotes/novo")}>
          <Plus className="size-4" /> Adicionar
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        <SelectField
          value={filter}
          onValueChange={(val) => updateUrl({ situacao: val, pagina: 1 })}
          items={[
            { value: STATUS_FILTER.ALL, label: "Todos" },
            { value: STATUS_FILTER.ACTIVE, label: "Vigente" },
            { value: STATUS_FILTER.INACTIVE, label: "Encerrado" },
          ]}
        />

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
        {batches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
            <PackageOpen size={50} className="opacity-30" />
            <p className="text-2xl">Nenhum registro encontrado.</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={batches}
            pageCount={data.pageCount}
            pageIndex={pageIndex}
            pageSize={pageSize}
            total={data.total}
            initialSorting={[{ id: "updatedAt", desc: true }]}
            onPageChange={setPageIndex}
            onPageSizeChange={(size) => updateUrl({ itens: size, pagina: 1 })}
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
        <DialogContent className="h-[90vh] content-start overflow-y-auto p-8 sm:max-w-5xl">
          {viewingDetailsId && (
            <BatchDetails
              id={viewingDetailsId}
              onClose={() => setViewingDetailsId(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={closingBatch !== null}
        onOpenChange={(open) => {
          if (!open) setClosingBatch(null);
        }}
        onConfirm={confirmClose}
        variant="default"
        title="Encerrar lote"
        description={
          closingBatch
            ? `O lote "${closingBatch.name}" será encerrado${
                closingBatch.area
                  ? ` e a área "${closingBatch.area.name}" ficará livre para outro lote`
                  : ""
              }. O histórico do lote continua disponível no filtro de encerrados.`
            : undefined
        }
        confirmLabel="Encerrar"
        cancelLabel="Voltar"
      />

      <BatchReopenDialog
        batch={reopeningBatch}
        propertyId={currentProperty?.id}
        onOpenChange={(open) => {
          if (!open) setReopeningBatch(null);
        }}
      />

      <AlertDialog
        open={batchWithAnimals !== null}
        onOpenChange={(open) => {
          if (!open) setBatchWithAnimals(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>O lote ainda tem animais</AlertDialogTitle>
            <AlertDialogDescription>
              {batchWithAnimals
                ? `O lote "${batchWithAnimals.row.name}" tem ${batchWithAnimals.animalCount} animal(is) ativo(s). Transfira-os para outro lote e, depois de confirmar a transferência, encerre o lote.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="border-border">
            <AlertDialogCancel variant="secondary">Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                batchWithAnimals &&
                navigate(
                  `/lotes/transferencias/nova?origem=${batchWithAnimals.row.id}`,
                )
              }
            >
              <ArrowRightLeft className="size-4" /> Transferir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
