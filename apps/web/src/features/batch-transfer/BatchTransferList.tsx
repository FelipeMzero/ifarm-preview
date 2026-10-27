import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowRight,
  ArrowRightLeft,
  CircleCheckBig,
  Eye,
  Pencil,
  Plus,
  Search,
  XCircle,
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

import { ConfirmDialog } from "@/components/our/ConfirmDialog";
import { DataTable } from "@/components/our/DataTable";
import { ErrorPage } from "@/components/our/ErrorPage";
import { SelectField } from "@/components/our/SelectField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrentProperty } from "@/features/shell/useCurrentProperty";
import { batchTransferClient } from "@/lib/clients";
import {
  type BatchTransferRow,
  type BatchTransferListParams,
  formatDateTime,
} from "@ifarm/shared";
import { TransferStatusBadge } from "./display";
import { describeStocking } from "@/features/area/StockingNotice";
import { stockingPreviewQuery } from "@/features/area/queries";
import { animalKeys } from "@/features/animal/queries";
import { batchKeys } from "@/features/batch/queries";
import { ListSkeleton } from "@/components/our/PageSkeletons";
import { batchTransferKeys, batchTransferListQuery } from "./queries";

const DEFAULT_PAGE_SIZE = 10;

const STATUS_FILTER = {
  ALL: "todas",
  PENDING: "pendentes",
  CONFIRMED: "confirmadas",
  CANCELLED: "canceladas",
} as const;
type StatusFilter = (typeof STATUS_FILTER)[keyof typeof STATUS_FILTER];

// Filtro da tela (o valor na URL) → situação aceita pela API.
const STATUS_BY_FILTER: Record<
  StatusFilter,
  BatchTransferListParams["status"]
> = {
  todas: undefined,
  pendentes: "pending",
  confirmadas: "confirmed",
  canceladas: "cancelled",
};

const URL_DEFAULTS = {
  busca: "",
  situacao: STATUS_FILTER.PENDING as string,
  pagina: "1",
  itens: String(DEFAULT_PAGE_SIZE),
};
type UrlParam = keyof typeof URL_DEFAULTS;

function readFilters(searchParams: URLSearchParams) {
  const get = (key: UrlParam) => searchParams.get(key) ?? URL_DEFAULTS[key];
  const situacao = get("situacao");
  const filter = (
    situacao in STATUS_BY_FILTER ? situacao : STATUS_FILTER.PENDING
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

type PendingAction = { type: "confirm" | "cancel"; row: BatchTransferRow };

function buildColumns(handlers: {
  onEdit: (id: string) => void;
  onConfirm: (row: BatchTransferRow) => void;
  onCancel: (row: BatchTransferRow) => void;
}): ColumnDef<BatchTransferRow>[] {
  return [
    {
      header: "Data",
      accessorKey: "transferredAt",
      cell: ({ row }) => formatDateTime(row.original.transferredAt),
    },
    {
      id: "route",
      header: "Origem → Destino",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <span
            className="max-w-48 truncate"
            title={row.original.originBatches.join(", ")}
          >
            {row.original.originBatches.join(", ") || "—"}
          </span>
          <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="font-medium">
            {row.original.destinationBatch.name}
          </span>
        </div>
      ),
    },
    {
      header: "Animais",
      accessorKey: "animalCount",
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => <TransferStatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      enableSorting: false,
      cell: ({ row }) => {
        const isPending = row.original.status === "pending";
        return (
          <div className="flex items-center justify-end gap-1">
            {isPending && (
              <Button
                variant="outline"
                size="sm"
                title="Confirmar transferência"
                onClick={() => handlers.onConfirm(row.original)}
              >
                <CircleCheckBig className="size-4" /> Confirmar
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              title={isPending ? "Editar" : "Visualizar"}
              onClick={() => handlers.onEdit(row.original.id)}
            >
              {isPending ? (
                <Pencil className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </Button>
            {isPending && (
              <Button
                variant="ghost"
                size="icon-sm"
                title="Cancelar transferência"
                className="text-destructive hover:text-destructive"
                onClick={() => handlers.onCancel(row.original)}
              >
                <XCircle className="size-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];
}

export function BatchTransferList() {
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
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );

  useEffect(() => {
    if (search === debouncedSearch) return;
    const timer = setTimeout(
      () => updateUrl({ busca: search, pagina: 1 }),
      300,
    );
    return () => clearTimeout(timer);
  });

  const params: BatchTransferListParams = {
    propertyId: currentProperty?.id,
    page: pageIndex,
    pageSize,
    search: debouncedSearch,
    status: STATUS_BY_FILTER[filter],
  };
  // Ao trocar de página ou de filtro, a lista anterior fica na tela (esmaecida) até chegar a
  // nova (keepPreviousData). Sem a propriedade atual, a busca traria as de todas.
  const { data, isPending, isPlaceholderData, refetch } = useQuery({
    ...batchTransferListQuery(params),
    enabled: !isPropertyLoading,
    placeholderData: keepPreviousData,
  });
  const transfers: BatchTransferRow[] = data?.data ?? [];

  // Aviso de lotação excedida da transferência em confirmação (só com o diálogo aberto).
  const confirmingId =
    pendingAction?.type === "confirm" ? pendingAction.row.id : null;
  const { data: stockingPreview } = useQuery({
    ...stockingPreviewQuery({ transferId: confirmingId ?? "" }),
    enabled: !!confirmingId,
  });

  // Confirmar muda os animais de lote: recarrega também lotes e animais.
  const runAction = useMutation({
    mutationFn: ({ type, row }: PendingAction) =>
      type === "confirm"
        ? batchTransferClient.confirmBatchTransfer(row.id)
        : batchTransferClient.cancelBatchTransfer(row.id),
    onSuccess: (_, { type }) => {
      toast.success(
        type === "confirm"
          ? "Transferência confirmada! Os animais mudaram de lote."
          : "Transferência cancelada.",
      );
      queryClient.invalidateQueries({ queryKey: batchTransferKeys.all });
      if (type === "confirm") {
        queryClient.invalidateQueries({ queryKey: batchKeys.all });
        queryClient.invalidateQueries({ queryKey: animalKeys.all });
      }
    },
    // O diálogo já fechou no clique (AlertDialogAction); o aviso explica a falha.
    onError: (e) => toast.error(e.message),
  });

  function runPendingAction() {
    if (pendingAction) runAction.mutate(pendingAction);
    setPendingAction(null);
  }

  const columns = buildColumns({
    onEdit: (id) => navigate(`/lotes/transferencias/${id}`),
    onConfirm: (row) => setPendingAction({ type: "confirm", row }),
    onCancel: (row) => setPendingAction({ type: "cancel", row }),
  });

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

  const actionRow = pendingAction?.row;

  return (
    <div className="w-full max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Transferências entre Lotes</h1>
        <Button onClick={() => navigate("/lotes/transferencias/nova")}>
          <Plus className="size-4" /> Adicionar
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por lote ou observação..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        <SelectField
          value={filter}
          onValueChange={(val) =>
            updateUrl({ situacao: val || STATUS_FILTER.PENDING, pagina: 1 })
          }
          items={[
            { value: STATUS_FILTER.PENDING, label: "Pendentes" },
            { value: STATUS_FILTER.CONFIRMED, label: "Confirmadas" },
            { value: STATUS_FILTER.CANCELLED, label: "Canceladas" },
            { value: STATUS_FILTER.ALL, label: "Todas" },
          ]}
        />
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
        {transfers.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
            <ArrowRightLeft size={50} className="opacity-30" />
            <p className="text-2xl">
              {filter === STATUS_FILTER.PENDING
                ? "Nenhuma transferência pendente."
                : "Nenhum registro encontrado."}
            </p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={transfers}
            pageCount={data.pageCount}
            pageIndex={pageIndex}
            pageSize={pageSize}
            total={data.total}
            onPageChange={setPageIndex}
            onPageSizeChange={(size) => updateUrl({ itens: size, pagina: 1 })}
          />
        )}
      </div>

      <ConfirmDialog
        open={pendingAction?.type === "confirm"}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
        onConfirm={runPendingAction}
        variant="default"
        title="Confirmar transferência"
        description={
          actionRow
            ? `${actionRow.animalCount} animal(is) serão movidos para o lote "${actionRow.destinationBatch.name}" em ${formatDateTime(actionRow.transferredAt)}. Após confirmada, a transferência não poderá mais ser alterada.${
                stockingPreview?.exceeds
                  ? ` Atenção, lotação excedida: ${describeStocking(stockingPreview)}`
                  : ""
              }`
            : undefined
        }
        confirmLabel="Confirmar"
        cancelLabel="Voltar"
      />

      <ConfirmDialog
        open={pendingAction?.type === "cancel"}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
        onConfirm={runPendingAction}
        title="Cancelar transferência"
        description="O plano será cancelado e nenhum animal mudará de lote. O registro continua disponível no filtro de canceladas."
        confirmLabel="Sim, cancelar"
        cancelLabel="Voltar"
      />
    </div>
  );
}
