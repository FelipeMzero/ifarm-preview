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
import { useNavigate, useSearchParams } from "react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";

import { ConfirmDialog } from "@/components/our/ConfirmDialog";
import { DataTable } from "@/components/our/DataTable";
import { ErrorPage } from "@/components/our/ErrorPage";
import { SelectField } from "@/components/our/SelectField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrentProperty } from "@/features/shell/useCurrentProperty";
import { NoPropertySelected } from "@/features/shell/NoPropertySelected";
import { SessionStatusBadge } from "./display";
import { managementSessionClient } from "@/lib/clients";
import {
  isSessionOpen,
  type ManagementSessionRow,
  nowInZone,
  type ManagementSessionListParams,
  formatDateTime,
} from "@ifarm/shared";
import { ListSkeleton } from "@/components/our/PageSkeletons";
import { managementSessionListQuery, useReloadSessions } from "./queries";

const DEFAULT_PAGE_SIZE = 10;

const STATUS_FILTER = {
  OPEN: "abertas",
  CONFIRMED: "consolidadas",
  CANCELLED: "canceladas",
  ALL: "todas",
} as const;
type StatusFilter = (typeof STATUS_FILTER)[keyof typeof STATUS_FILTER];

// Filtro da tela (o valor na URL) → situação aceita pela API.
const STATUS_BY_FILTER: Record<
  StatusFilter,
  ManagementSessionListParams["status"]
> = {
  abertas: "open",
  consolidadas: "confirmed",
  canceladas: "cancelled",
  todas: undefined,
};

const URL_DEFAULTS = {
  busca: "",
  situacao: STATUS_FILTER.OPEN as string,
  pagina: "1",
  itens: String(DEFAULT_PAGE_SIZE),
};
type UrlParam = keyof typeof URL_DEFAULTS;

function readFilters(searchParams: URLSearchParams) {
  const get = (key: UrlParam) => searchParams.get(key) ?? URL_DEFAULTS[key];
  const situacao = get("situacao");
  const filter = (
    situacao in STATUS_BY_FILTER ? situacao : STATUS_FILTER.OPEN
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

function buildColumns(handlers: {
  onRegister: (id: string) => void;
  onStart: (id: string) => void;
  onEdit: (id: string) => void;
  onCancel: (row: ManagementSessionRow) => void;
}): ColumnDef<ManagementSessionRow>[] {
  return [
    {
      header: "Data",
      accessorKey: "scheduledAt",
      cell: ({ row }) => {
        const { scheduledAt, performedAt } = row.original;
        return (
          <div className="flex flex-col leading-tight">
            <span>{formatDateTime(performedAt ?? scheduledAt)}</span>
            {performedAt &&
              performedAt.slice(0, 10) !== scheduledAt.slice(0, 10) && (
                <span className="text-xs text-muted-foreground">
                  prevista {formatDateTime(scheduledAt)}
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
        const open = isSessionOpen(status);
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

export function ManagementSessionList() {
  const navigate = useNavigate();
  const {
    property: currentProperty,
    isLoading: isPropertyLoading,
    timeZone,
  } = useCurrentProperty();
  const reloadSessions = useReloadSessions();
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
  const [cancelling, setCancelling] = useState<ManagementSessionRow | null>(
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

  // Ao trocar de página ou de filtro, a lista anterior fica na tela (esmaecida) até chegar a
  // nova (keepPreviousData). Sem a propriedade atual, a busca traria as de todas.
  const { data, isPending, isPlaceholderData, refetch } = useQuery({
    ...managementSessionListQuery({
      propertyId: currentProperty?.id,
      page: pageIndex,
      pageSize,
      search: debouncedSearch,
      status: STATUS_BY_FILTER[filter],
    }),
    // Só com a propriedade: a API pede sempre o propertyId.
    enabled: !!currentProperty,
    placeholderData: keepPreviousData,
  });
  const sessions: ManagementSessionRow[] = data?.data ?? [];

  const cancelSession = useMutation({
    mutationFn: (row: ManagementSessionRow) =>
      managementSessionClient.cancelManagementSession(row.id),
    onSuccess: () => {
      toast.success("Sessão de manejo cancelada.");
      return reloadSessions();
    },
    // O diálogo já fechou no clique (AlertDialogAction); o aviso explica a falha.
    onError: (e) => toast.error(e.message),
  });
  // Inicia com a data de hoje; a data pode ser corrigida no cabeçalho do registro.
  const startSession = useMutation({
    mutationFn: (id: string) =>
      managementSessionClient.startManagementSession(id, nowInZone(timeZone)),
    onSuccess: (_, id) => {
      toast.success("Registro iniciado com a data de hoje.");
      reloadSessions();
      navigate(`/manejos/${id}/registro`);
    },
    onError: (e) => toast.error(e.message),
  });

  function runCancel() {
    if (cancelling) cancelSession.mutate(cancelling);
    setCancelling(null);
  }

  const columns = buildColumns({
    onRegister: (id) => navigate(`/manejos/${id}/registro`),
    onStart: (id) => startSession.mutate(id),
    onEdit: (id) => navigate(`/manejos/${id}`),
    onCancel: setCancelling,
  });

  if (!isPropertyLoading && !currentProperty) return <NoPropertySelected />;

  if (isPending) return <ListSkeleton columns={6} />;

  if (!data) {
    return (
      <ErrorPage
        message="Não foi possível obter os dados do servidor."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="w-full max-w-6xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Sessões de Manejo</h1>
        <Button onClick={() => navigate("/manejos/novo")}>
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
          onValueChange={(val) =>
            updateUrl({ situacao: val || STATUS_FILTER.OPEN, pagina: 1 })
          }
          items={[
            { value: STATUS_FILTER.OPEN, label: "Em aberto" },
            { value: STATUS_FILTER.CONFIRMED, label: "Consolidadas" },
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
