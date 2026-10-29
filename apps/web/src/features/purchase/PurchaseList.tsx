import { ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil, Plus, Search, ShoppingCart } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { DataTable } from "@/components/our/DataTable";
import { ErrorPage } from "@/components/our/ErrorPage";
import { SelectField } from "@/components/our/SelectField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrentProperty } from "@/features/shell/useCurrentProperty";
import { NoPropertySelected } from "@/features/shell/NoPropertySelected";
import { PurchaseStatusBadge, ReceivedCount, formatBRL } from "./display";
import {
  type PurchaseRow,
  type PurchaseListParams,
  formatDay,
} from "@ifarm/shared";
import { ListSkeleton } from "@/components/our/PageSkeletons";
import { purchaseListQuery } from "./queries";

const DEFAULT_PAGE_SIZE = 10;

const STATUS_FILTER = {
  OPEN: "andamento",
  CONFIRMED: "consolidadas",
  CANCELLED: "canceladas",
  ALL: "todas",
} as const;
type StatusFilter = (typeof STATUS_FILTER)[keyof typeof STATUS_FILTER];

// Filtro da tela (o valor na URL) → situação aceita pela API.
const STATUS_BY_FILTER: Record<StatusFilter, PurchaseListParams["status"]> = {
  andamento: "open",
  consolidadas: "confirmed",
  canceladas: "cancelled",
  todas: "all",
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

export function PurchaseList() {
  const navigate = useNavigate();
  const { property: currentProperty, isLoading: isPropertyLoading } =
    useCurrentProperty();
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

  useEffect(() => {
    if (search === debouncedSearch) return;
    const timer = setTimeout(
      () => updateUrl({ busca: search, pagina: 1 }),
      300,
    );
    return () => clearTimeout(timer);
  });

  const params: PurchaseListParams = {
    propertyId: currentProperty?.id,
    page: pageIndex,
    pageSize,
    search: debouncedSearch,
    status: STATUS_BY_FILTER[filter],
  };
  // Ao trocar de página ou de filtro, a lista anterior fica na tela (esmaecida) até chegar a
  // nova (keepPreviousData). Sem a propriedade atual, a busca traria as de todas.
  const { data, isPending, isPlaceholderData, refetch } = useQuery({
    ...purchaseListQuery(params),
    // Só com a propriedade: a API pede sempre o propertyId.
    enabled: !!currentProperty,
    placeholderData: keepPreviousData,
  });
  const purchases: PurchaseRow[] = data?.data ?? [];

  const columns = buildColumns((id) => navigate(`/compras/${id}`));

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
          onValueChange={(val) =>
            updateUrl({ situacao: val || STATUS_FILTER.OPEN, pagina: 1 })
          }
          items={[
            { value: STATUS_FILTER.OPEN, label: "Em andamento" },
            { value: STATUS_FILTER.CONFIRMED, label: "Consolidadas" },
            { value: STATUS_FILTER.ALL, label: "Todas (exceto canceladas)" },
            { value: STATUS_FILTER.CANCELLED, label: "Canceladas" },
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
        {purchases.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
            <ShoppingCart size={50} className="opacity-30" />
            <p className="text-2xl">Nenhuma compra encontrada.</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={purchases}
            pageCount={data.pageCount}
            pageIndex={pageIndex}
            pageSize={pageSize}
            total={data.total}
            onPageChange={setPageIndex}
            onPageSizeChange={(size) => updateUrl({ itens: size, pagina: 1 })}
          />
        )}
      </div>
    </div>
  );
}
