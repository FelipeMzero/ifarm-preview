"use client";

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
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { DataTable } from "@/components/our/DataTable";
import ListSkeleton from "@/components/our/ListSkeleton";
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
} from "@ifarm/shared";
import { ConfirmDialog } from "@/components/our/ConfirmDialog";
import { ErrorPage } from "@/components/our/ErrorPage";
import { useCurrentProperty } from "@/features/shell/CurrentPropertyProvider";
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
import BatchDetails from "./BatchDetails";
import { BatchReopenDialog } from "./BatchReopenDialog";

const DEFAULT_PAGE_SIZE = 10;

const STATUS_FILTER = {
  ALL: "todos",
  ACTIVE: "vigente",
  INACTIVE: "encerrado",
} as const;

function filterToStatus(filter: string): BatchListParams["status"] {
  if (filter === STATUS_FILTER.ACTIVE) return "active";
  if (filter === STATUS_FILTER.INACTIVE) return "inactive";
  return undefined;
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

export default function BatchList() {
  const router = useRouter();
  const { property: currentProperty } = useCurrentProperty();

  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pageCount, setPageCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState<string>(STATUS_FILTER.ACTIVE);
  const [loading, setLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [viewingDetailsId, setViewingDetailsId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [closingBatch, setClosingBatch] = useState<BatchRow | null>(null);
  const [reopeningBatch, setReopeningBatch] = useState<BatchRow | null>(null);
  // Lote que não pôde ser encerrado por ainda ter animais.
  const [batchWithAnimals, setBatchWithAnimals] = useState<{
    row: BatchRow;
    animalCount: number;
  } | null>(null);

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
        const result = await batchClient.getBatches({
          propertyId: currentProperty?.id,
          page: pageIndex,
          pageSize,
          search: debouncedSearch,
          status: filterToStatus(filter),
        });
        if (!cancelled) {
          setBatches(result.data);
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

  function requestClose(row: BatchRow) {
    // A contagem da listagem já indica animais; o servidor confirma na hora de encerrar.
    if (row.animalCount > 0) {
      setBatchWithAnimals({ row, animalCount: row.animalCount });
    } else {
      setClosingBatch(row);
    }
  }

  async function confirmClose() {
    const row = closingBatch;
    if (!row) return;
    setClosingBatch(null);
    try {
      await batchClient.closeBatch(row.id);
      toast.success(`Lote "${row.name}" encerrado.`);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      if (e instanceof BatchCloseError && e.code === "HAS_ANIMALS") {
        setBatchWithAnimals({ row, animalCount: e.animalCount ?? 0 });
      } else {
        toast.error((e as Error).message);
      }
    }
  }

  const columns = buildColumns(
    (id) => router.push(`/lotes/${id}`),
    setViewingDetailsId,
    requestClose,
    setReopeningBatch,
  );

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

  return (
    <div className="w-full max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Lotes</h1>
        </div>
        <Button onClick={() => router.push("/lotes/novo")}>
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
          onValueChange={(val) => {
            setFilter(val);
            setPageIndex(0);
          }}
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

      <div
        className={
          loading ? "opacity-60 transition-opacity" : "transition-opacity"
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
        onReopened={() => setRefreshKey((k) => k + 1)}
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
                router.push(
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
