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
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useEffect, useState } from "react";

import { DataTable } from "@/components/our/DataTable";
import ListSkeleton from "@/components/our/ListSkeleton";
import { ConfirmDialog } from "@/components/our/ConfirmDialog";
import PropertyDetails from "./PropertyDetails";
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
import { type PropertyRow, type PropertyListParams } from "@ifarm/shared";
import { ErrorPage } from "@/components/our/ErrorPage";
import { useCurrentProperty } from "@/features/shell/CurrentPropertyProvider";
import {
  INITIAL_PROPERTY_LIST_PARAMS,
  propertyKeys,
  propertyListQuery,
} from "./queries";

const DEFAULT_PAGE_SIZE = INITIAL_PROPERTY_LIST_PARAMS.pageSize;

const STATUS_FILTER = {
  ALL: "todos",
  ACTIVE: "ativo",
  INACTIVE: "inativo",
} as const;

function filterToStatus(filter: string): PropertyListParams["status"] {
  if (filter === STATUS_FILTER.ACTIVE) return "active";
  if (filter === STATUS_FILTER.INACTIVE) return "inactive";
  return undefined;
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

export default function PropertyList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { refresh: refreshCurrentProperty } = useCurrentProperty();
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState<string>(STATUS_FILTER.ACTIVE);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    totalArea: false,
  });
  const [viewingDetailsId, setViewingDetailsId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPageIndex(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const params: PropertyListParams = {
    page: pageIndex,
    pageSize,
    search: debouncedSearch,
    status: filterToStatus(filter),
  };
  // Ao trocar de página ou de filtro, a lista anterior fica na tela (esmaecida) até chegar a
  // nova (keepPreviousData).
  const { data, isPending, isFetching, isError, refetch } = useQuery({
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
      refreshCurrentProperty();
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

  if (isError) {
    return (
      <ErrorPage
        message={"Não foi possível obter os dados do servidor."}
        onRetry={() => refetch()}
      />
    );
  }

  if (isPending) {
    return <ListSkeleton columns={5} />;
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
          onValueChange={(val) => {
            setFilter(val);
            setPageIndex(0);
          }}
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

      <div
        className={
          isFetching ? "opacity-60 transition-opacity" : "transition-opacity"
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
