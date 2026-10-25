import { ColumnDef } from "@tanstack/react-table";
import { ChevronRight, Search, Truck } from "lucide-react";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";

import { DataTable } from "@/components/our/DataTable";
import { ErrorPage } from "@/components/our/ErrorPage";
import { SelectField } from "@/components/our/SelectField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrentProperty } from "@/features/shell/CurrentPropertyProvider";
import { ReceivedCount, formatDay } from "@/features/purchase/display";
import { receptionClient } from "@/lib/clients";
import { type ReceptionFilter, type ReceptionPurchase } from "@ifarm/shared";
import { ListSkeleton } from "@/components/our/PageSkeletons";

const DEFAULT_PAGE_SIZE = 10;

function buildColumns(
  onOpen: (id: string) => void,
): ColumnDef<ReceptionPurchase>[] {
  return [
    {
      header: "Data da compra",
      accessorKey: "purchaseDate",
      enableSorting: false,
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
        <div className="flex max-w-96 flex-col text-sm text-muted-foreground">
          {row.original.categories.map((c) => (
            <span key={c.id} className="truncate" title={c.label}>
              {c.label}{" "}
              <ReceivedCount
                received={c.receivedQuantity}
                expected={c.expectedQuantity}
              />
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
      id: "situation",
      header: "Situação",
      enableSorting: false,
      cell: ({ row }) => {
        const p = row.original;
        if (p.status === "confirmed") {
          return <Badge>Consolidada</Badge>;
        }
        if (p.hasOpenReception) {
          return (
            <Badge
              variant="outline"
              className="border-warning/40 bg-warning/10 text-warning"
            >
              Em andamento
            </Badge>
          );
        }
        if (p.receivedQuantity < p.expectedQuantity) {
          return <Badge variant="outline">A receber</Badge>;
        }
        return <Badge variant="secondary">Recebida</Badge>;
      },
    },
    {
      id: "actions",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="icon-sm"
            title="Abrir"
            onClick={() => onOpen(row.original.id)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      ),
    },
  ];
}

export default function ReceptionPurchaseList() {
  const navigate = useNavigate();
  const { property: currentProperty } = useCurrentProperty();

  const [purchases, setPurchases] = useState<ReceptionPurchase[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pageCount, setPageCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState<ReceptionFilter>("pending");
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
        const result = await receptionClient.getReceptionPurchases({
          propertyId: currentProperty?.id,
          page: pageIndex,
          pageSize,
          search: debouncedSearch,
          filter,
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

  const columns = buildColumns((id) => navigate(`/recepcoes/compras/${id}`));

  if (error) {
    return (
      <ErrorPage
        message="Não foi possível obter os dados do servidor."
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (isFirstLoad) return <ListSkeleton columns={5} />;

  return (
    <div className="w-full max-w-6xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Recepções</h1>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, vendedor ou GTA..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <SelectField
          value={filter}
          onValueChange={(val) => {
            setFilter((val as ReceptionFilter) || "pending");
            setPageIndex(0);
          }}
          items={[
            { value: "pending", label: "A receber" },
            { value: "all", label: "Todas" },
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
            <Truck size={50} className="opacity-30" />
            <p className="text-2xl">
              {filter === "pending"
                ? "Nenhuma compra a receber."
                : "Nenhuma compra encontrada."}
            </p>
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
