"use client";

import { ColumnDef, VisibilityState } from "@tanstack/react-table";
import { Beef, Pencil, Plus, Search, Settings2, Trash2 } from "lucide-react";

import { useEffect, useState } from "react";

import { ConfirmDialog } from "@/components/our/ConfirmDialog";
import { DataTable } from "@/components/our/DataTable";
import ListSkeleton from "@/components/our/ListSkeleton";
import AnimalForm from "./AnimalForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { AnimalRow, deleteAnimal, getAnimais } from "./services";
import { EnumAnimalStatus, EnumSexo } from "./schema";
import { ErrorPage } from "@/components/our/ErrorPage";

const DEFAULT_PAGE_SIZE = 10;

const COLUMN_LABELS: Record<string, string> = {
  brinco: "Brinco",
  rfid: "RFID",
  sexo: "Sexo",
  origem: "Origem",
  status: "Status",
  peso_atual_kg: "Peso Atual",
  updatedAt: "Atualizado em",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  [EnumAnimalStatus.ATIVO]: "default",
  [EnumAnimalStatus.VENDIDO]: "secondary",
  [EnumAnimalStatus.MORTO]: "destructive",
  [EnumAnimalStatus.TRANSFERIDO]: "outline",
  [EnumAnimalStatus.DESCARTE]: "outline",
  [EnumAnimalStatus.ABATE]: "destructive",
};

const SEXO_LABEL: Record<string, string> = {
  [EnumSexo.M]: "♂ Macho",
  [EnumSexo.F]: "♀ Fêmea",
};

function buildColumns(
  onRequestEdit: (id: string) => void,
  onRequestDelete: (id: string) => void,
): ColumnDef<AnimalRow>[] {
  return [
    {
      header: "Brinco",
      accessorKey: "brinco",
      cell: ({ row }) => row.original.brinco ?? "—",
    },
    {
      header: "RFID",
      accessorKey: "rfid",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.rfid ?? "—"}</span>
      ),
    },
    {
      header: "Sexo",
      accessorKey: "sexo",
      cell: ({ row }) => SEXO_LABEL[row.original.sexo] ?? row.original.sexo,
    },
    {
      header: "Peso Atual",
      accessorKey: "peso_atual_kg",
      cell: ({ row }) =>
        row.original.peso_atual_kg != null ? `${row.original.peso_atual_kg} kg` : "—",
    },
    {
      header: "Origem",
      accessorKey: "origem",
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.origem}</Badge>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => (
        <Badge variant={STATUS_VARIANT[row.original.status] ?? "outline"}>
          {row.original.status}
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
          <Button variant="ghost" size="icon-sm" onClick={() => onRequestEdit(row.original.id)}>
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-destructive hover:text-destructive"
            onClick={() => onRequestDelete(row.original.id)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];
}

export default function AnimalList() {
  const [animais, setAnimais] = useState<AnimalRow[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pageCount, setPageCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<string>(EnumAnimalStatus.ATIVO);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

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
        const result = await getAnimais({ page: pageIndex, pageSize, search: debouncedSearch, status });
        if (!cancelled) {
          setAnimais(result.data);
          setPageCount(result.pageCount);
          setTotal(result.total);
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [pageIndex, pageSize, debouncedSearch, status, refreshKey]);

  async function confirmDelete() {
    if (pendingDeleteId === null) return;
    try {
      await deleteAnimal(pendingDeleteId);
      setRefreshKey((k) => k + 1);
    } catch {
      // erro silencioso
    } finally {
      setPendingDeleteId(null);
    }
  }

  const columns = buildColumns(setEditingId, setPendingDeleteId);

  if (error) {
    return (
      <ErrorPage message={"Não foi possível obter os dados do servidor."} onRetry={() => window.location.reload()} />
    );
  }

  if (loading && animais.length === 0) return <ListSkeleton columns={6} />;

  return (
    <div className="w-full max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Animais</h1>
          <p className="text-sm text-muted-foreground">
            {total} registro{total !== 1 ? "s" : ""} encontrado{total !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="size-4" /> Novo Animal
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar por brinco, RFID ou apelido..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPageIndex(0); }}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Todos os status</option>
          <option value={EnumAnimalStatus.ATIVO}>Ativos</option>
          <option value={EnumAnimalStatus.VENDIDO}>Vendidos</option>
          <option value={EnumAnimalStatus.MORTO}>Mortos</option>
          <option value={EnumAnimalStatus.TRANSFERIDO}>Transferidos</option>
          <option value={EnumAnimalStatus.ABATE}>Abatidos</option>
          <option value={EnumAnimalStatus.DESCARTE}>Descarte</option>
        </select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
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

      {!loading && animais.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
          <Beef size={40} className="opacity-30" />
          <p className="text-sm">Nenhum animal encontrado.</p>
        </div>
      )}

      <DataTable
        columns={columns}
        data={loading ? [] : animais}
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

      <Dialog open={isCreating} onOpenChange={(open) => { if (!open) setIsCreating(false); }}>
        <DialogContent className="bg-background p-8 sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Novo animal</DialogTitle>
          </DialogHeader>
          <AnimalForm
            onCancel={() => setIsCreating(false)}
            onSuccess={() => { setIsCreating(false); setRefreshKey((k) => k + 1); }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={editingId !== null} onOpenChange={(open) => { if (!open) setEditingId(null); }}>
        <DialogContent className="bg-background sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Editar animal</DialogTitle>
          </DialogHeader>
          <AnimalForm
            id={editingId ?? undefined}
            onCancel={() => setEditingId(null)}
            onSuccess={() => { setEditingId(null); setRefreshKey((k) => k + 1); }}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => { if (!open) setPendingDeleteId(null); }}
        onConfirm={confirmDelete}
        description="Esta ação não pode ser desfeita. O registro será removido permanentemente."
      />
    </div>
  );
}
