import { ColumnDef } from "@tanstack/react-table";
import { ChevronRight, Search, Truck } from "lucide-react";
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
import { ReceivedCount } from "@/features/purchase/display";
import {
  type ReceptionFilter,
  type ReceptionPurchase,
  formatDay,
} from "@ifarm/shared";
import { ListSkeleton } from "@/components/our/PageSkeletons";
import { receptionPurchaseListQuery } from "./queries";

const DEFAULT_PAGE_SIZE = 10;

// Filtro da tela (o valor na URL) → filtro aceito pela API.
const FILTER_BY_URL: Record<string, ReceptionFilter> = {
  "a-receber": "pending",
  todas: "all",
};

const URL_DEFAULTS = {
  busca: "",
  situacao: "a-receber",
  pagina: "1",
  itens: String(DEFAULT_PAGE_SIZE),
};
type UrlParam = keyof typeof URL_DEFAULTS;

function readFilters(searchParams: URLSearchParams) {
  const get = (key: UrlParam) => searchParams.get(key) ?? URL_DEFAULTS[key];
  const situacao = get("situacao");
  const urlFilter =
    situacao in FILTER_BY_URL ? situacao : URL_DEFAULTS.situacao;
  const positive = (key: UrlParam) => {
    const n = Number(get(key));
    return Number.isInteger(n) && n > 0 ? n : Number(URL_DEFAULTS[key]);
  };
  return {
    search: get("busca"),
    urlFilter,
    filter: FILTER_BY_URL[urlFilter],
    pageIndex: positive("pagina") - 1,
    pageSize: Math.min(positive("itens"), 100),
  };
}

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

export function ReceptionPurchaseList() {
  const navigate = useNavigate();
  const { property: currentProperty, isLoading: isPropertyLoading } =
    useCurrentProperty();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    search: debouncedSearch,
    urlFilter,
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

  // Ao trocar de página ou de filtro, a lista anterior fica na tela (esmaecida) até chegar a
  // nova (keepPreviousData). Sem a propriedade atual, a busca traria as de todas.
  const { data, isPending, isPlaceholderData, refetch } = useQuery({
    ...receptionPurchaseListQuery({
      propertyId: currentProperty?.id,
      page: pageIndex,
      pageSize,
      search: debouncedSearch,
      filter,
    }),
    enabled: !isPropertyLoading,
    placeholderData: keepPreviousData,
  });
  const purchases: ReceptionPurchase[] = data?.data ?? [];

  const columns = buildColumns((id) => navigate(`/recepcoes/compras/${id}`));

  if (isPending) return <ListSkeleton columns={5} />;

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
          value={urlFilter}
          onValueChange={(val) =>
            updateUrl({ situacao: val || URL_DEFAULTS.situacao, pagina: 1 })
          }
          items={[
            { value: "a-receber", label: "A receber" },
            { value: "todas", label: "Todas" },
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
