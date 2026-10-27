import { ColumnDef, VisibilityState } from "@tanstack/react-table";
import {
  IdCard,
  MapPin,
  Pencil,
  Plus,
  Power,
  Search,
  Settings2,
  Fence,
  User,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useEffect, useState } from "react";

import { DataTable } from "@/components/our/DataTable";
import { ConfirmDialog } from "@/components/our/ConfirmDialog";
import { PropertyDetails } from "./PropertyDetails";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
import { propertyClient } from "@/lib/clients";
import {
  type PropertyRow,
  type PropertyListParams,
  formatDateTime,
} from "@ifarm/shared";
import { ErrorPage } from "@/components/our/ErrorPage";
import { useLocalStorageState } from "@/hooks/use-local-storage-state";
import { propertyKeys, propertyListQuery } from "./queries";
import { ListSkeleton } from "@/components/our/PageSkeletons";

const DEFAULT_PAGE_SIZE = 10;

const STATUS_FILTER = {
  ALL: "todos",
  ACTIVE: "ativo",
  INACTIVE: "inativo",
} as const;
type StatusFilter = (typeof STATUS_FILTER)[keyof typeof STATUS_FILTER];

const STATUS_BY_FILTER: Record<StatusFilter, PropertyListParams["status"]> = {
  todos: undefined,
  ativo: "active",
  inativo: "inactive",
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
  totalArea: "Área Total",
  location: "Município/UF",
  ownerName: "Titular",
  status: "Status",
  updatedAt: "Atualizado em",
};

function buildColumns(
  onRequestToggleStatus: (id: string) => void,
  onRequestEdit: (id: string) => void,
  onRequestViewDetails: (id: string) => void,
): ColumnDef<PropertyRow>[] {
  return [
    {
      header: "Nome",
      accessorKey: "name",
      cell: ({ row }) => row.original.name ?? "—",
    },
    {
      header: "Área Total",
      accessorKey: "totalArea",
      cell: ({ row }) =>
        row.original.totalArea != null ? `${row.original.totalArea} ha` : "—",
    },
    {
      header: "Município/UF",
      id: "location",
      accessorFn: (row) =>
        row.city && row.state ? `${row.city}/${row.state}` : "",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <MapPin className="size-4 text-muted-foreground" />
          <span>
            {row.original.city && row.original.state
              ? `${row.original.city}/${row.original.state}`
              : "—"}
          </span>
        </div>
      ),
    },
    {
      header: "Titular",
      accessorKey: "ownerName",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <User className="size-4 text-muted-foreground" />
          <span>{row.original.ownerName ?? "—"}</span>
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => (
        <Badge variant={row.original.deactivatedAt ? "outline" : "default"}>
          {row.original.deactivatedAt ? "Inativo" : "Ativo"}
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
            title={row.original.deactivatedAt ? "Ativar" : "Desativar"}
            className={
              row.original.deactivatedAt
                ? undefined
                : "text-destructive hover:text-destructive"
            }
            onClick={() => onRequestToggleStatus(row.original.id)}
          >
            <Power className="size-4" />
          </Button>
        </div>
      ),
    },
  ];
}

export function PropertyList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
    useLocalStorageState<VisibilityState>("propriedades:colunas", {
      totalArea: false,
    });
  const [viewingDetailsId, setViewingDetailsId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    if (search === debouncedSearch) return;
    const timer = setTimeout(
      () => updateUrl({ busca: search, pagina: 1 }),
      300,
    );
    return () => clearTimeout(timer);
  });

  const params: PropertyListParams = {
    page: pageIndex,
    pageSize,
    search: debouncedSearch,
    status: STATUS_BY_FILTER[filter],
  };
  // Ao trocar de página ou de filtro, a lista anterior fica na tela (esmaecida) até chegar a
  // nova (keepPreviousData).
  const { data, isPending, isPlaceholderData, refetch } = useQuery({
    ...propertyListQuery(params),
    placeholderData: keepPreviousData,
  });
  const properties: PropertyRow[] = data?.data ?? [];

  const reloadProperties = () =>
    queryClient.invalidateQueries({ queryKey: propertyKeys.all });

  const toggleStatus = useMutation({
    mutationFn: (id: string) => propertyClient.togglePropertyStatus(id),
    onSuccess: () => {
      reloadProperties();
      setTogglingId(null);
    },
    // O diálogo já fechou no clique (AlertDialogAction); o aviso explica a falha.
    onError: (e) => {
      toast.error(
        e.message || "Não foi possível alterar a situação da propriedade.",
      );
    },
  });

  function confirmToggleStatus() {
    if (togglingId) toggleStatus.mutate(togglingId);
  }

  const togglingProperty = properties.find((p) => p.id === togglingId);

  const columns = buildColumns(
    setTogglingId,
    (id) => navigate(`/propriedades/${id}`),
    setViewingDetailsId,
  );

  if (isPending) {
    return <ListSkeleton columns={5} />;
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
          <h1 className="text-xl font-semibold">Propriedades</h1>
        </div>
        <Button onClick={() => navigate("/propriedades/novo")}>
          <Plus className="size-4" /> Adicionar
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar por nome ou titular..."
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
            { value: STATUS_FILTER.ACTIVE, label: "Ativo" },
            { value: STATUS_FILTER.INACTIVE, label: "Inativo" },
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
        {properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
            <Fence size={50} className="opacity-30" />
            <p className="text-2xl">Nenhum registro encontrado.</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={properties}
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
        <DialogContent className="p-8 sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          {viewingDetailsId && (
            <PropertyDetails
              id={viewingDetailsId}
              onClose={() => {
                setViewingDetailsId(null);
                reloadProperties();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={togglingId !== null}
        onOpenChange={(open) =>
          !open && !toggleStatus.isPending && setTogglingId(null)
        }
        onConfirm={confirmToggleStatus}
        title={
          togglingProperty?.deactivatedAt
            ? "Confirmar ativação"
            : "Confirmar inativação"
        }
        description={
          togglingProperty?.deactivatedAt
            ? "Tem certeza que deseja ativar esta propriedade?"
            : "Tem certeza que deseja inativar esta propriedade? Ela deixará de aparecer nas listagens de novos cadastros."
        }
        confirmLabel={togglingProperty?.deactivatedAt ? "Ativar" : "Inativar"}
        variant={togglingProperty?.deactivatedAt ? "default" : "destructive"}
      />
    </div>
  );
}
