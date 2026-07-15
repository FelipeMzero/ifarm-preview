"use client";

import { ColumnDef, VisibilityState } from "@tanstack/react-table";
import { IdCard, MapPin, Pencil, Plus, Power, Search, Settings2, Tractor, User } from "lucide-react";
import { useRouter } from "next/navigation";

import { useEffect, useState } from "react";

import { DataTable } from "@/components/our/DataTable";
import ListSkeleton from "@/components/our/ListSkeleton";
import { ConfirmDialog } from "@/components/our/ConfirmDialog";
import PropertyDetails from "./PropertyDetails";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
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
import { PropertyRow, getProperties, togglePropertyStatus } from "./services";
import { ErrorPage } from "@/components/our/ErrorPage";

const DEFAULT_PAGE_SIZE = 10;

const STATUS_FILTER = { ALL: "todos", ACTIVE: "ativo", INACTIVE: "inativo" } as const;

function filterToStatus(filter: string): string | undefined {
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
      cell: ({ row }) => row.original.totalArea != null ? `${row.original.totalArea} ha` : "—",
    },
    {
      header: "Município/UF",
      id: "location",
      accessorFn: (row) => row.city && row.state ? `${row.city}/${row.state}` : "",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <MapPin className="size-4 text-muted-foreground" />
          <span>{row.original.city && row.original.state ? `${row.original.city}/${row.original.state}` : "—"}</span>
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
          day: "2-digit", month: "2-digit", year: "numeric",
          hour: "2-digit", minute: "2-digit",
        });
      },
    },
    {
      id: "actions",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" title="Editar" onClick={() => onRequestEdit(row.original.id)}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" title="Detalhes" onClick={() => onRequestViewDetails(row.original.id)}>
            <IdCard className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            title={row.original.deactivatedAt ? "Ativar" : "Desativar"}
            className={row.original.deactivatedAt ? undefined : "text-destructive hover:text-destructive"}
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
  const router = useRouter();
  const [properties, setProperties] = useState<PropertyRow[]>([]);
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
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({ totalArea: false, updatedAt: false });
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewingDetailsId, setViewingDetailsId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [isToggling, setIsToggling] = useState(false);

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
        const result = await getProperties({ page: pageIndex, pageSize, search: debouncedSearch, status: filterToStatus(filter) });
        if (!cancelled) {
          setProperties(result.data);
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
    return () => { cancelled = true; };
  }, [pageIndex, pageSize, debouncedSearch, filter, refreshKey]);

  async function confirmToggleStatus() {
    if (!togglingId) return;

    setIsToggling(true);
    try {
      await togglePropertyStatus(togglingId);
      setRefreshKey((k) => k + 1);
      setTogglingId(null);
    } catch {
      // erro silencioso
    } finally {
      setIsToggling(false);
    }
  }

  const togglingProperty = properties.find((p) => p.id === togglingId);

  const columns = buildColumns(
    setTogglingId,
    (id) => router.push(`/propriedades/${id}`),
    setViewingDetailsId,
  );

  if (error) {
    return (
      <ErrorPage message={"Não foi possível obter os dados do servidor."} onRetry={() => window.location.reload()} />
    );
  }

  if (isFirstLoad) {
    return (
      <ListSkeleton columns={5} />
    );
  }

  return (
    <div className="w-full max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Propriedades</h1>
        </div>
        <Button onClick={() => router.push("/propriedades/novo")}>
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
          onValueChange={(val) => { setFilter(val); setPageIndex(0); }}
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

      <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
        {properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
            <Tractor size={50} className="opacity-30" />
            <p className="text-2xl">Nenhum registro encontrado.</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={properties}
            pageCount={pageCount}
            pageIndex={pageIndex}
            pageSize={pageSize}
            total={total}
            initialSorting={[{ id: "updatedAt", desc: true }]}
            onPageChange={setPageIndex}
            onPageSizeChange={(size) => { setPageSize(size); setPageIndex(0); }}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
          />
        )}
      </div>

      <Dialog open={viewingDetailsId !== null} onOpenChange={(open) => { if (!open) setViewingDetailsId(null); }}>
        <DialogContent className="p-8 sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          {viewingDetailsId && (
            <PropertyDetails
              id={viewingDetailsId}
              onClose={() => { setViewingDetailsId(null); setRefreshKey((k) => k + 1); }}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={togglingId !== null}
        onOpenChange={(open) => !open && !isToggling && setTogglingId(null)}
        onConfirm={confirmToggleStatus}
        title={togglingProperty?.deactivatedAt ? "Confirmar ativação" : "Confirmar inativação"}
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
