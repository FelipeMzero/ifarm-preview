"use client";

import { ColumnDef, VisibilityState } from "@tanstack/react-table";
import {
  Pencil,
  Plus,
  Search,
  Settings2,
  PackageOpen,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
import { BatchRow, getBatches } from "./services";
import { ErrorPage } from "@/components/our/ErrorPage";
import { useCurrentProperty } from "@/features/shell/CurrentPropertyProvider";

const DEFAULT_PAGE_SIZE = 10;

const STATUS_FILTER = {
  ALL: "todos",
  ACTIVE: "vigente",
  INACTIVE: "encerrado",
} as const;

function filterToStatus(filter: string): string | undefined {
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
        const result = await getBatches({
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
  }, [pageIndex, pageSize, debouncedSearch, filter, currentProperty?.id]);

  const columns = buildColumns((id) => router.push(`/lotes/${id}`));

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
    </div>
  );
}
