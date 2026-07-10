"use client";

import { ColumnDef, VisibilityState } from "@tanstack/react-table";
import { Building2, Pencil, Plus, Power, Search, Settings2, Trash2, User, Users } from "lucide-react";

import React, { useEffect, useState } from "react";

import { ConfirmDialog } from "@/components/our/ConfirmDialog";
import { DataTable } from "@/components/our/DataTable";
import ListSkeleton from "@/components/our/ListSkeleton";
import PessoaForm from "./PessoaForm";
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
import { PessoaRow, deletePessoa, getPessoas, togglePessoaStatus } from "./services";
import { EnumPessoaTipo } from "./schema";
import { ErrorPage } from "@/components/our/ErrorPage";
import { formatDocumento } from "@/lib/documento";

const DEFAULT_PAGE_SIZE = 10;

function formatTelefone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11) return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  if (digits.length === 10) return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return value;
}

const COLUMN_LABELS: Record<string, string> = {
  documento: "Documento",
  nome: "Nome",
  telefone: "Telefone",
  email: "E-mail",
  status: "Status",
  atualizadoEm: "Atualizado em",
};

const TIPO_LABEL: Record<string, string> = {
  [EnumPessoaTipo.FISICA]: "Física",
  [EnumPessoaTipo.JURIDICA]: "Jurídica",
};

const TIPO_ICON: Record<string, React.ReactNode> = {
  [EnumPessoaTipo.FISICA]: <User className="size-4 text-muted-foreground" />,
  [EnumPessoaTipo.JURIDICA]: <Building2 className="size-4 text-muted-foreground" />,
};

function buildColumns(
  onRequestToggleStatus: (id: string) => void,
  onRequestEdit: (id: string) => void,
  onRequestDelete: (id: string) => void,
): ColumnDef<PessoaRow>[] {
  return [
    {
      header: "Documento",
      accessorKey: "documento",
      cell: ({ row }) => (
        <div className="flex items-center gap-2" title={TIPO_LABEL[row.original.tipo] ?? row.original.tipo}>
          {TIPO_ICON[row.original.tipo]}
          <span>{row.original.documento ? formatDocumento(row.original.tipo, row.original.documento) : "—"}</span>
        </div>
      ),
    },
    {
      header: "Nome",
      accessorKey: "nome",
      cell: ({ row }) => row.original.nome ?? "—",
    },
    {
      header: "Telefone",
      accessorKey: "telefone",
      cell: ({ row }) => row.original.telefone ? formatTelefone(row.original.telefone) : "—",
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
        <Badge variant={row.original.desativadoEm ? "outline" : "default"}>
          {row.original.desativadoEm ? "Inativo" : "Ativo"}
        </Badge>
      ),
    },
    {
      header: "Atualizado em",
      accessorKey: "atualizadoEm",
      cell: ({ row }) => {
        const iso = row.original.atualizadoEm;
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
          <Button
            variant="ghost"
            size="icon-sm"
            title={row.original.desativadoEm ? "Ativar" : "Desativar"}
            onClick={() => onRequestToggleStatus(row.original.id)}
          >
            <Power className="size-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" title="Editar" onClick={() => onRequestEdit(row.original.id)}>
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            title="Excluir"
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

export default function PessoaList() {
  const [pessoas, setPessoas] = useState<PessoaRow[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pageCount, setPageCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tipo, setTipo] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({ telefone: false, email: false });
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
        const result = await getPessoas({ page: pageIndex, pageSize, search: debouncedSearch, tipo });
        if (!cancelled) {
          setPessoas(result.data);
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
  }, [pageIndex, pageSize, debouncedSearch, tipo, refreshKey]);

  async function confirmDelete() {
    if (pendingDeleteId === null) return;
    try {
      await deletePessoa(pendingDeleteId);
      setRefreshKey((k) => k + 1);
    } catch {
      // erro silencioso
    } finally {
      setPendingDeleteId(null);
    }
  }

  async function toggleStatus(id: string) {
    try {
      await togglePessoaStatus(id);
      setRefreshKey((k) => k + 1);
    } catch {
      // erro silencioso
    }
  }

  const columns = buildColumns(toggleStatus, setEditingId, setPendingDeleteId);

  if (error) {
    return (
      <ErrorPage message={"Não foi possível obter os dados do servidor."} onRetry={() => window.location.reload()} />
    );
  }

  if (isFirstLoad) {
    return (
      <ListSkeleton columns={7} />
    );
  }

  return (
    <div className="w-full max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Pessoas</h1>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="size-4" /> Nova Pessoa
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
          value={tipo}
          onValueChange={(val) => { setTipo(val); setPageIndex(0); }}
          items={[
            { value: "", label: "Todos" },
            { value: EnumPessoaTipo.FISICA, label: "Física" },
            { value: EnumPessoaTipo.JURIDICA, label: "Jurídica" },
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
        {pessoas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
            <Users size={50} className="opacity-30" />
            <p className="text-2xl">Nenhum registro encontrado.</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={pessoas}
            pageCount={pageCount}
            pageIndex={pageIndex}
            pageSize={pageSize}
            total={total}
            initialSorting={[{ id: "atualizadoEm", desc: true }]}
            onPageChange={setPageIndex}
            onPageSizeChange={(size) => { setPageSize(size); setPageIndex(0); }}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
          />
        )}
      </div>

      <Dialog open={isCreating} onOpenChange={(open) => { if (!open) setIsCreating(false); }}>
        <DialogContent className="p-8 sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <PessoaForm
            title="Nova Pessoa"
            onCancel={() => setIsCreating(false)}
            onSuccess={() => { setIsCreating(false); setRefreshKey((k) => k + 1); }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={editingId !== null} onOpenChange={(open) => { if (!open) setEditingId(null); }}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <PessoaForm
            id={editingId ?? undefined}
            title="Editar Pessoa"
            onCancel={() => setEditingId(null)}
            onSuccess={() => { setEditingId(null); setRefreshKey((k) => k + 1); }}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => { if (!open) setPendingDeleteId(null); }}
        onConfirm={confirmDelete}
        description="Tem certeza que deseja excluir este registro?"
      />
    </div>
  );
}
