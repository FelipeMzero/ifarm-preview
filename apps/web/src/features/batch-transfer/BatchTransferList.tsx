"use client";

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
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/our/ConfirmDialog";
import { DataTable } from "@/components/our/DataTable";
import ListSkeleton from "@/components/our/ListSkeleton";
import { ErrorPage } from "@/components/our/ErrorPage";
import { SelectField } from "@/components/our/SelectField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrentProperty } from "@/features/shell/CurrentPropertyProvider";
import {
  BatchTransferRow,
  cancelBatchTransfer,
  confirmBatchTransfer,
  getBatchTransfers,
} from "./services";
import { TransferStatusBadge, formatTransferDate } from "./display";
import { getStockingPreview } from "@/features/area/stocking";
import { describeStocking } from "@/features/area/StockingNotice";

const DEFAULT_PAGE_SIZE = 10;

const STATUS_FILTER = {
  ALL: "todas",
  PENDING: "pending",
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled",
} as const;

type PendingAction = { type: "confirm" | "cancel"; row: BatchTransferRow };

function buildColumns(handlers: {
  onEdit: (id: string) => void;
  onConfirm: (row: BatchTransferRow) => void;
  onCancel: (row: BatchTransferRow) => void;
}): ColumnDef<BatchTransferRow>[] {
  return [
    {
      header: "Data",
      accessorKey: "transferDate",
      cell: ({ row }) => formatTransferDate(row.original.transferDate),
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

export default function BatchTransferList() {
  const router = useRouter();
  const { property: currentProperty } = useCurrentProperty();

  const [transfers, setTransfers] = useState<BatchTransferRow[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pageCount, setPageCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState<string>(STATUS_FILTER.PENDING);
  const [loading, setLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  // Aviso de lotação excedida da transferência em confirmação (por id, para não
  // exibir o aviso de outra linha enquanto a prévia carrega).
  const [stockingWarning, setStockingWarning] = useState<{
    transferId: string;
    text: string;
  } | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPageIndex(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const result = await getBatchTransfers({
          propertyId: currentProperty?.id,
          page: pageIndex,
          pageSize,
          search: debouncedSearch,
          status: filter === STATUS_FILTER.ALL ? undefined : filter,
        });
        if (!cancelled) {
          setTransfers(result.data);
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
    filter,
    refreshKey,
    currentProperty?.id,
  ]);

  async function runPendingAction() {
    if (!pendingAction) return;
    const { type, row } = pendingAction;
    setPendingAction(null);
    try {
      if (type === "confirm") {
        await confirmBatchTransfer(row.id);
        toast.success("Transferência confirmada! Os animais mudaram de lote.");
      } else {
        await cancelBatchTransfer(row.id);
        toast.success("Transferência cancelada.");
      }
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const columns = buildColumns({
    onEdit: (id) => router.push(`/lotes/transferencias/${id}`),
    onConfirm: (row) => {
      setPendingAction({ type: "confirm", row });
      getStockingPreview({ transferId: row.id })
        .then((preview) =>
          setStockingWarning(
            preview?.exceeds
              ? { transferId: row.id, text: describeStocking(preview) }
              : null,
          ),
        )
        .catch(() => setStockingWarning(null));
    },
    onCancel: (row) => setPendingAction({ type: "cancel", row }),
  });

  if (error) {
    return (
      <ErrorPage
        message="Não foi possível obter os dados do servidor."
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (isFirstLoad) {
    return <ListSkeleton columns={5} />;
  }

  const actionRow = pendingAction?.row;

  return (
    <div className="w-full max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Transferências entre Lotes</h1>
        <Button onClick={() => router.push("/lotes/transferencias/nova")}>
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
          onValueChange={(val) => {
            setFilter(val || STATUS_FILTER.PENDING);
            setPageIndex(0);
          }}
          items={[
            { value: STATUS_FILTER.PENDING, label: "Pendentes" },
            { value: STATUS_FILTER.CONFIRMED, label: "Confirmadas" },
            { value: STATUS_FILTER.CANCELLED, label: "Canceladas" },
            { value: STATUS_FILTER.ALL, label: "Todas" },
          ]}
        />
      </div>

      <div
        className={
          loading ? "opacity-60 transition-opacity" : "transition-opacity"
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
            pageCount={pageCount}
            pageIndex={pageIndex}
            pageSize={pageSize}
            total={total}
            onPageChange={setPageIndex}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPageIndex(0);
            }}
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
            ? `${actionRow.animalCount} animal(is) serão movidos para o lote "${actionRow.destinationBatch.name}" em ${formatTransferDate(actionRow.transferDate)}. Após confirmada, a transferência não poderá mais ser alterada.${
                stockingWarning?.transferId === actionRow.id
                  ? ` Atenção, lotação excedida: ${stockingWarning.text}`
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
