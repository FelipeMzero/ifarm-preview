"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  ClipboardList,
  Eye,
  Pencil,
  Play,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrentProperty } from "@/features/shell/CurrentPropertyProvider";
import { SessionStatusBadge, formatSessionDate, todayIso } from "./display";
import {
  cancelManagementSession,
  getManagementSessions,
  startManagementSession,
  type ManagementSessionRow,
} from "./services";

const DEFAULT_PAGE_SIZE = 10;

const STATUS_FILTER = {
  OPEN: "open",
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled",
  ALL: "todas",
} as const;

function buildColumns(handlers: {
  onRegister: (id: string) => void;
  onStart: (id: string) => void;
  onEdit: (id: string) => void;
  onCancel: (row: ManagementSessionRow) => void;
}): ColumnDef<ManagementSessionRow>[] {
  return [
    {
      header: "Data",
      accessorKey: "scheduledDate",
      cell: ({ row }) => {
        const { scheduledDate, managementDate } = row.original;
        return (
          <div className="flex flex-col leading-tight">
            <span>{formatSessionDate(managementDate ?? scheduledDate)}</span>
            {managementDate && managementDate !== scheduledDate && (
              <span className="text-xs text-muted-foreground">
                prevista {formatSessionDate(scheduledDate)}
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: "Título",
      accessorKey: "title",
      enableSorting: false,
      cell: ({ row }) => (
        <span
          className="block max-w-56 truncate font-medium"
          title={row.original.title}
        >
          {row.original.title}
        </span>
      ),
    },
    {
      id: "steps",
      header: "Manejos",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex max-w-80 flex-wrap gap-1">
          {row.original.steps.map((label, i) => (
            <Badge key={`${label}-${i}`} variant="outline">
              {label}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      id: "animals",
      header: "Animais",
      enableSorting: false,
      cell: ({ row }) => {
        const { status, animalCount, handledCount } = row.original;
        return status === "in_progress" ? (
          <span className="tabular-nums">
            {handledCount}/{animalCount} manejados
          </span>
        ) : (
          <span className="tabular-nums">{animalCount}</span>
        );
      },
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => <SessionStatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      enableSorting: false,
      cell: ({ row }) => {
        const { id, status } = row.original;
        const open = status === "planned" || status === "in_progress";
        return (
          <div className="flex items-center justify-end gap-1">
            {open && (
              <Button
                variant="outline"
                size="sm"
                title={
                  status === "planned"
                    ? "Iniciar o registro do manejo nos animais"
                    : "Continuar o registro de onde parou"
                }
                onClick={() =>
                  status === "planned"
                    ? handlers.onStart(id)
                    : handlers.onRegister(id)
                }
              >
                <Play className="size-4" />
                {status === "planned" ? "Iniciar" : "Continuar"}
              </Button>
            )}
            {status === "confirmed" && (
              <Button
                variant="ghost"
                size="icon-sm"
                title="Ver registros"
                onClick={() => handlers.onRegister(id)}
              >
                <ClipboardList className="size-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              title={open ? "Editar planejamento" : "Visualizar planejamento"}
              onClick={() => handlers.onEdit(id)}
            >
              {open ? (
                <Pencil className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </Button>
            {open && (
              <Button
                variant="ghost"
                size="icon-sm"
                title="Cancelar sessão"
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

export default function ManagementSessionList() {
  const router = useRouter();
  const { property: currentProperty } = useCurrentProperty();

  const [sessions, setSessions] = useState<ManagementSessionRow[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pageCount, setPageCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState<string>(STATUS_FILTER.OPEN);
  const [loading, setLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [cancelling, setCancelling] = useState<ManagementSessionRow | null>(
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
        const result = await getManagementSessions({
          propertyId: currentProperty?.id,
          page: pageIndex,
          pageSize,
          search: debouncedSearch,
          status: filter === STATUS_FILTER.ALL ? undefined : filter,
        });
        if (!cancelled) {
          setSessions(result.data);
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

  async function runCancel() {
    if (!cancelling) return;
    const row = cancelling;
    setCancelling(null);
    try {
      await cancelManagementSession(row.id);
      toast.success("Sessão de manejo cancelada.");
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const columns = buildColumns({
    onRegister: (id) => router.push(`/manejos/${id}/registro`),
    // Inicia com a data de hoje; a data pode ser corrigida no cabeçalho do registro.
    onStart: async (id) => {
      try {
        await startManagementSession(id, todayIso());
        toast.success("Registro iniciado com a data de hoje.");
        router.push(`/manejos/${id}/registro`);
      } catch (e) {
        toast.error((e as Error).message);
      }
    },
    onEdit: (id) => router.push(`/manejos/${id}`),
    onCancel: setCancelling,
  });

  if (error) {
    return (
      <ErrorPage
        message="Não foi possível obter os dados do servidor."
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (isFirstLoad) return <ListSkeleton columns={6} />;

  return (
    <div className="w-full max-w-6xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Sessões de Manejo</h1>
        <Button onClick={() => router.push("/manejos/novo")}>
          <Plus className="size-4" /> Adicionar
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por título ou observação..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        <SelectField
          value={filter}
          onValueChange={(val) => {
            setFilter(val || STATUS_FILTER.OPEN);
            setPageIndex(0);
          }}
          items={[
            { value: STATUS_FILTER.OPEN, label: "Em aberto" },
            { value: STATUS_FILTER.CONFIRMED, label: "Consolidadas" },
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
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
            <ClipboardList size={50} className="opacity-30" />
            <p className="text-2xl">
              {filter === STATUS_FILTER.OPEN
                ? "Nenhuma sessão de manejo em aberto."
                : "Nenhum registro encontrado."}
            </p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={sessions}
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
        open={cancelling !== null}
        onOpenChange={(open) => {
          if (!open) setCancelling(null);
        }}
        onConfirm={runCancel}
        title="Cancelar sessão de manejo"
        description="A sessão será cancelada e nenhum registro feito nela passará a valer. Os registros continuam disponíveis no filtro de canceladas."
        confirmLabel="Sim, cancelar"
        cancelLabel="Voltar"
      />
    </div>
  );
}
