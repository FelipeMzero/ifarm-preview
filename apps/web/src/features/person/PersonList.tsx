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
import { useNavigate } from "react-router";

import React, { useEffect, useState } from "react";

import { DataTable } from "@/components/our/DataTable";
import { ConfirmDialog } from "@/components/our/ConfirmDialog";
import PersonDetails from "./PersonDetails";
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
import { PERSON_TYPE_ITEMS, PERSON_TYPE_LABELS } from "@ifarm/shared";
import { ErrorPage } from "@/components/our/ErrorPage";
import { ListSkeleton } from "@/components/our/PageSkeletons";

const DEFAULT_PAGE_SIZE = 10;

const STATUS_FILTER = {
  ALL: "todos",
  ACTIVE: "ativo",
  INACTIVE: "inativo",
} as const;

function filterToParams(
  filter: string,
): Pick<PersonListParams, "type" | "status"> {
  if (filter === STATUS_FILTER.ACTIVE) return { status: "active" };
  if (filter === STATUS_FILTER.INACTIVE) return { status: "inactive" };
  if (filter === PersonType.INDIVIDUAL || filter === PersonType.COMPANY)
    return { type: filter };
  return {};
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11)
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  if (digits.length === 10)
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return value;
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

export default function PersonList() {
  const navigate = useNavigate();
  const [people, setPeople] = useState<PersonRow[]>([]);
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
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    phone: false,
    email: false,
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewingDetailsId, setViewingProfileId] = useState<string | null>(null);
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
        const result = await personClient.getPeople({
          page: pageIndex,
          pageSize,
          search: debouncedSearch,
          ...filterToParams(filter),
        });
        if (!cancelled) {
          setPeople(result.data);
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
  }, [pageIndex, pageSize, debouncedSearch, filter, refreshKey]);

  async function confirmToggleStatus() {
    if (!togglingId) return;

    setIsToggling(true);
    try {
      await personClient.togglePersonStatus(togglingId);
      setRefreshKey((k) => k + 1);
      setTogglingId(null);
    } catch {
      // erro silencioso
    } finally {
      setIsToggling(false);
    }
  }

  const togglingPerson = people.find((p) => p.id === togglingId);

  const columns = buildColumns(
    setTogglingId,
    (id) => navigate(`/pessoas/${id}`),
    setViewingProfileId,
  );

  if (error) {
    return (
      <ErrorPage
        message={"Não foi possível obter os dados do servidor."}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (isFirstLoad) {
    return <ListSkeleton columns={7} />;
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
          onValueChange={(val) => {
            setFilter(val);
            setPageIndex(0);
          }}
          items={[
            { value: STATUS_FILTER.ALL, label: "Todos" },
            { value: STATUS_FILTER.ACTIVE, label: "Ativo" },
            { value: STATUS_FILTER.INACTIVE, label: "Inativo" },
            ...PERSON_TYPE_ITEMS,
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
        {people.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
            <Users size={50} className="opacity-30" />
            <p className="text-2xl">Nenhum registro encontrado.</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={people}
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

      <Dialog
        open={viewingDetailsId !== null}
        onOpenChange={(open) => {
          if (!open) setViewingProfileId(null);
        }}
      >
        <DialogContent className="p-8 sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          {viewingDetailsId && (
            <PersonDetails
              id={viewingDetailsId}
              onClose={() => {
                setViewingProfileId(null);
                setRefreshKey((k) => k + 1);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={togglingId !== null}
        onOpenChange={(open) => !open && !isToggling && setTogglingId(null)}
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
