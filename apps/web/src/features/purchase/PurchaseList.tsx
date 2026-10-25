import { ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil, Plus, Search, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";

import { DataTable } from "@/components/our/DataTable";
import { ErrorPage } from "@/components/our/ErrorPage";
import { SelectField } from "@/components/our/SelectField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrentProperty } from "@/features/shell/CurrentPropertyProvider";
import {
  PurchaseStatusBadge,
  ReceivedCount,
  formatBRL,
  formatDay,
} from "./display";
import { purchaseClient } from "@/lib/clients";
import { type PurchaseRow, type PurchaseListParams } from "@ifarm/shared";
import { ListSkeleton } from "@/components/our/PageSkeletons";

const DEFAULT_PAGE_SIZE = 10;

const STATUS_FILTER = {
  OPEN: "open",
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled",
  ALL: "all",
} as const;

// Filtro da tela → situação aceita pela API (o que não está aqui = sem filtro).
const STATUS_PARAM: Record<string, PurchaseListParams["status"]> = {
  [STATUS_FILTER.OPEN]: "open",
  [STATUS_FILTER.CONFIRMED]: "confirmed",
  [STATUS_FILTER.CANCELLED]: "cancelled",
  [STATUS_FILTER.ALL]: "all",
};

function buildColumns(onOpen: (id: string) => void): ColumnDef<PurchaseRow>[] {
  return [
    {
      header: "Data",
      accessorKey: "purchaseDate",
      cell: ({ row }) => formatDay(row.original.purchaseDate),
    },
    {
      header: "Compra",
      accessorKey: "title",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex max-w-64 flex-col">
          <span className="truncate font-medium" title={row.original.title}>
            {row.original.title}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {row.original.seller.name}
          </span>
        </div>
      ),
    },
    {
      id: "categories",
      header: "Categorias",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex max-w-80 flex-col text-sm text-muted-foreground">
          {row.original.categories.map((c, i) => (
            <span key={i} className="truncate" title={c}>
              {c}
            </span>
          ))}
        </div>
      ),
    },
    {
      id: "received",
      header: "Recebidos",
      enableSorting: false,
      cell: ({ row }) => (
        <ReceivedCount
          received={row.original.receivedQuantity}
          expected={row.original.expectedQuantity}
        />
      ),
    },
    {
      id: "value",
      header: "Valor",
      enableSorting: false,
      cell: ({ row }) =>
        row.original.value != null ? (
          <span className="tabular-nums">{formatBRL(row.original.value)}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      header: "Situação",
      accessorKey: "status",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          <PurchaseStatusBadge status={row.original.status} />
          {row.original.status === "open" && row.original.paid && (
            <Badge variant="outline">Paga</Badge>
          )}
        </div>
      ),
    },
    {
      id: "actions",
      enableSorting: false,
      cell: ({ row }) => {
        const editable = row.original.status === "open";
        return (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="icon-sm"
              title={editable ? "Abrir e editar" : "Abrir"}
              onClick={() => onOpen(row.original.id)}
            >
              {editable ? (
                <Pencil className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </Button>
          </div>
        );
      },
    },
  ];
}

export default function PurchaseList() {
  const navigate = useNavigate();
  const { property: currentProperty } = useCurrentProperty();

  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
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
        const result = await purchaseClient.getPurchases({
          propertyId: currentProperty?.id,
          page: pageIndex,
          pageSize,
          search: debouncedSearch,
          status: STATUS_PARAM[filter],
        });
        if (cancelled) return;
        setPurchases(result.data);
        setPageCount(result.pageCount);
        setTotal(result.total);
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
  }, [pageIndex, pageSize, debouncedSearch, filter, currentProperty?.id]);

  const columns = buildColumns((id) => navigate(`/compras/${id}`));

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
        <h1 className="text-xl font-semibold">Compras</h1>
        <Button onClick={() => navigate("/compras/novo")}>
          <Plus className="size-4" /> Adicionar
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, vendedor, GTA, nota fiscal ou observação..."
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
            { value: STATUS_FILTER.OPEN, label: "Em andamento" },
            { value: STATUS_FILTER.CONFIRMED, label: "Consolidadas" },
            { value: STATUS_FILTER.ALL, label: "Todas (exceto canceladas)" },
            { value: STATUS_FILTER.CANCELLED, label: "Canceladas" },
          ]}
        />
      </div>

      <div
        className={
          loading ? "opacity-60 transition-opacity" : "transition-opacity"
        }
      >
        {purchases.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
            <ShoppingCart size={50} className="opacity-30" />
            <p className="text-2xl">Nenhuma compra encontrada.</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={purchases}
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
    </div>
  );
}
