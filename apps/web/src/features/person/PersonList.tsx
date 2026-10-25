import { ColumnDef, VisibilityState } from "@tanstack/react-table";
import {
  Building2,
  IdCard,
  Pencil,
  Plus,
  Power,
  Search,
  Settings2,
  User,
  Users,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import React, { useEffect, useState } from "react";

import { DataTable } from "@/components/our/DataTable";
import { ConfirmDialog } from "@/components/our/ConfirmDialog";
import { PersonDetails } from "./PersonDetails";
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
import { personClient } from "@/lib/clients";
import {
  PersonType,
  formatTaxId,
  type PersonRow,
  type PersonListParams,
} from "@ifarm/shared";
import { PERSON_TYPE_LABELS } from "@ifarm/shared";
import { ErrorPage } from "@/components/our/ErrorPage";
import { ListSkeleton } from "@/components/our/PageSkeletons";
import { useLocalStorageState } from "@/hooks/use-local-storage-state";
import { formatPhone } from "./format";
import { personKeys, personListQuery } from "./queries";

const DEFAULT_PAGE_SIZE = 10;

// O filtro da lista (situação ou tipo de pessoa): o valor na URL e o que vai para a API.
const FILTERS = {
  todos: { label: "Todos", params: {} },
  ativo: { label: "Ativo", params: { status: "active" } },
  inativo: { label: "Inativo", params: { status: "inactive" } },
  fisica: {
    label: PERSON_TYPE_LABELS[PersonType.INDIVIDUAL],
    params: { type: PersonType.INDIVIDUAL },
  },
  juridica: {
    label: PERSON_TYPE_LABELS[PersonType.COMPANY],
    params: { type: PersonType.COMPANY },
  },
} satisfies Record<
  string,
  { label: string; params: Pick<PersonListParams, "type" | "status"> }
>;
type Filter = keyof typeof FILTERS;
const DEFAULT_FILTER: Filter = "ativo";

const URL_DEFAULTS = {
  busca: "",
  filtro: DEFAULT_FILTER as string,
  pagina: "1",
  itens: String(DEFAULT_PAGE_SIZE),
};
type UrlParam = keyof typeof URL_DEFAULTS;

function readFilters(searchParams: URLSearchParams) {
  const get = (key: UrlParam) => searchParams.get(key) ?? URL_DEFAULTS[key];
  const filtro = get("filtro");
  const filter = (filtro in FILTERS ? filtro : DEFAULT_FILTER) as Filter;
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
  taxId: "Documento",
  name: "Nome",
  phone: "Telefone",
  email: "E-mail",
  status: "Status",
  updatedAt: "Atualizado em",
};

const TYPE_LABEL: Record<string, string> = PERSON_TYPE_LABELS;

const TYPE_ICON: Record<string, React.ReactNode> = {
  [PersonType.INDIVIDUAL]: <User className="size-4 text-muted-foreground" />,
  [PersonType.COMPANY]: <Building2 className="size-4 text-muted-foreground" />,
};

function buildColumns(
  onRequestToggleStatus: (id: string) => void,
  onRequestEdit: (id: string) => void,
  onRequestViewDetails: (id: string) => void,
): ColumnDef<PersonRow>[] {
  return [
    {
      header: "Documento",
      accessorKey: "taxId",
      cell: ({ row }) => (
        <div
          className="flex items-center gap-2"
          title={TYPE_LABEL[row.original.type] ?? row.original.type}
        >
          {TYPE_ICON[row.original.type]}
          <span>
            {row.original.taxId
              ? formatTaxId(row.original.type, row.original.taxId)
              : "—"}
          </span>
        </div>
      ),
    },
    {
      header: "Nome",
      accessorKey: "name",
      cell: ({ row }) => row.original.name ?? "—",
    },
    {
      header: "Telefone",
      accessorKey: "phone",
      cell: ({ row }) =>
        row.original.phone ? formatPhone(row.original.phone) : "—",
    },
    {
      header: "E-mail",
      accessorKey: "email",
      cell: ({ row }) => row.original.email ?? "—",
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

export function PersonList() {
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
    useLocalStorageState<VisibilityState>("pessoas:colunas", {
      phone: false,
      email: false,
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

  const params: PersonListParams = {
    page: pageIndex,
    pageSize,
    search: debouncedSearch,
    ...FILTERS[filter].params,
  };
  // Ao trocar de página ou de filtro, a lista anterior fica na tela (esmaecida) até chegar a
  // nova (keepPreviousData).
  const { data, isPending, isPlaceholderData, refetch } = useQuery({
    ...personListQuery(params),
    placeholderData: keepPreviousData,
  });
  const people: PersonRow[] = data?.data ?? [];

  const reloadPeople = () =>
    queryClient.invalidateQueries({ queryKey: personKeys.all });

  const toggleStatus = useMutation({
    mutationFn: (id: string) => personClient.togglePersonStatus(id),
    onSuccess: () => {
      reloadPeople();
      setTogglingId(null);
    },
    // O diálogo já fechou no clique (AlertDialogAction); o aviso explica a falha.
    onError: (e) => {
      toast.error(
        e.message || "Não foi possível alterar a situação da pessoa.",
      );
    },
  });

  function confirmToggleStatus() {
    if (togglingId) toggleStatus.mutate(togglingId);
  }

  const togglingPerson = people.find((p) => p.id === togglingId);

  const columns = buildColumns(
    setTogglingId,
    (id) => navigate(`/pessoas/${id}`),
    setViewingDetailsId,
  );

  if (isPending) {
    return <ListSkeleton columns={7} />;
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
          <h1 className="text-xl font-semibold">Pessoas</h1>
        </div>
        <Button onClick={() => navigate("/pessoas/novo")}>
          <Plus className="size-4" /> Adicionar
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar por nome ou documento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        <SelectField
          value={filter}
          onValueChange={(val) => updateUrl({ filtro: val, pagina: 1 })}
          items={Object.entries(FILTERS).map(([value, { label }]) => ({
            value,
            label,
          }))}
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
        {people.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
            <Users size={50} className="opacity-30" />
            <p className="text-2xl">Nenhum registro encontrado.</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={people}
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
            <PersonDetails
              id={viewingDetailsId}
              onClose={() => {
                setViewingDetailsId(null);
                reloadPeople();
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
          togglingPerson?.deactivatedAt
            ? "Confirmar ativação"
            : "Confirmar inativação"
        }
        description={
          togglingPerson?.deactivatedAt
            ? "Tem certeza que deseja ativar esta pessoa?"
            : "Tem certeza que deseja inativar esta pessoa? Ela deixará de aparecer nas listagens de novos cadastros."
        }
        confirmLabel={togglingPerson?.deactivatedAt ? "Ativar" : "Inativar"}
        variant={togglingPerson?.deactivatedAt ? "default" : "destructive"}
      />
    </div>
  );
}
