"use client";

import { ColumnDef, VisibilityState } from "@tanstack/react-table";
import {
  Beef,
  IdCard,
  Nfc,
  Pencil,
  Plus,
  Search,
  Settings2,
  Tag,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";

import React, { useEffect, useState } from "react";

import { ConfirmDialog } from "@/components/our/ConfirmDialog";
import { DataTable } from "@/components/our/DataTable";
import ListSkeleton from "@/components/our/ListSkeleton";
import { Badge } from "@/components/ui/badge";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SelectField } from "@/components/our/SelectField";
import { AnimalRow, deleteAnimal, getAnimals } from "./services";
import { EnumAnimalStatus } from "./schema";
import { ORIGIN_VARIANT, SEX_ICON, STATUS_VARIANT } from "./display";
import AnimalDetails from "./AnimalDetails";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  ANIMAL_ORIGIN_LABELS,
  ANIMAL_STATUS_LABELS,
  ANIMAL_STATUS_ITEMS,
} from "@/lib/enum-labels";
import { ErrorPage } from "@/components/our/ErrorPage";
import { useCurrentProperty } from "@/features/shell/CurrentPropertyProvider";

const DEFAULT_PAGE_SIZE = 10;

const COLUMN_LABELS: Record<string, string> = {
  sex: "Sexo",
  origin: "Origem",
  status: "Status",
  currentWeightKg: "Peso Atual",
  updatedAt: "Atualizado em",
};

// Destaca o identificador principal (brinco → RFID → ID) e mantém o ID sempre visível.
function AnimalIdentification({ animal }: { animal: AnimalRow }) {
  const { code, earTag, rfid } = animal;
  const primary = earTag
    ? { label: "Brinco", value: earTag, icon: Tag }
    : rfid
      ? { label: "RFID", value: rfid, icon: Nfc }
      : null;

  if (!primary) {
    return <span className="font-medium tabular-nums">ID {code}</span>;
  }

  const Icon = primary.icon;

  return (
    <div className="flex flex-col leading-tight">
      <div className="flex items-center gap-1.5">
        <Icon
          className="size-3.5 shrink-0 text-muted-foreground"
          aria-label={primary.label}
        />
        <span className="max-w-40 truncate font-medium" title={primary.value}>
          {primary.value}
        </span>
        {earTag && rfid && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                aria-label={`RFID ${rfid}`}
              >
                <Nfc className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              RFID <span className="font-mono">{rfid}</span>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <span className="text-xs text-muted-foreground tabular-nums">
        ID {code}
      </span>
    </div>
  );
}

function buildColumns(
  onRequestEdit: (id: string) => void,
  onRequestViewDetails: (id: string) => void,
  onRequestDelete: (id: string) => void,
): ColumnDef<AnimalRow>[] {
  return [
    {
      id: "identification",
      header: "Identificação",
      accessorFn: (row) => row.earTag ?? row.rfid ?? `ID ${row.code}`,
      cell: ({ row }) => <AnimalIdentification animal={row.original} />,
    },
    {
      header: "Sexo",
      accessorKey: "sex",
      cell: ({ row }) => SEX_ICON[row.original.sex] ?? row.original.sex,
    },
    {
      header: "Peso Atual",
      accessorKey: "currentWeightKg",
      cell: ({ row }) =>
        row.original.currentWeightKg != null
          ? `${row.original.currentWeightKg} kg`
          : "—",
    },
    {
      header: "Origem",
      accessorKey: "origin",
      cell: ({ row }) => (
        <Badge variant={ORIGIN_VARIANT[row.original.origin] ?? "outline"}>
          {ANIMAL_ORIGIN_LABELS[
            row.original.origin as keyof typeof ANIMAL_ORIGIN_LABELS
          ] ?? row.original.origin}
        </Badge>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => (
        <Badge variant={STATUS_VARIANT[row.original.status] ?? "outline"}>
          {ANIMAL_STATUS_LABELS[
            row.original.status as keyof typeof ANIMAL_STATUS_LABELS
          ] ?? row.original.status}
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

export default function AnimalList() {
  const router = useRouter();
  const { property: currentProperty } = useCurrentProperty();
  const [animals, setAnimals] = useState<AnimalRow[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pageCount, setPageCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<string>(EnumAnimalStatus.ACTIVE);
  const [loading, setLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    origin: false,
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [viewingDetailsId, setViewingDetailsId] = useState<string | null>(
    null,
  );

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
        const result = await getAnimals({
          propertyId: currentProperty?.id,
          page: pageIndex,
          pageSize,
          search: debouncedSearch,
          status,
        });
        if (!cancelled) {
          setAnimals(result.data);
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
  }, [
    pageIndex,
    pageSize,
    debouncedSearch,
    status,
    refreshKey,
    currentProperty?.id,
  ]);

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

  const columns = buildColumns(
    (id) => router.push(`/animais/${id}`),
    setViewingDetailsId,
    setPendingDeleteId,
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
    return <ListSkeleton columns={6} />;
  }

  return (
    <div className="w-full max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Animais</h1>
        </div>
        <Button onClick={() => router.push("/animais/novo")}>
          <Plus className="size-4" /> Novo Animal
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar por ID, brinco, RFID ou apelido..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        <SelectField
          value={status}
          onValueChange={(val) => {
            setStatus(val);
            setPageIndex(0);
          }}
          items={[{ value: "", label: "Todos" }, ...ANIMAL_STATUS_ITEMS]}
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
        {animals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
            <Beef size={50} className="opacity-30" />
            <p className="text-2xl">Nenhum animal encontrado.</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={animals}
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
          if (!open) setViewingDetailsId(null);
        }}
      >
        <DialogContent className="p-8 sm:max-w-5xl h-[90vh] content-start overflow-y-auto">
          {viewingDetailsId && (
            <AnimalDetails
              id={viewingDetailsId}
              onClose={() => {
                setViewingDetailsId(null);
                setRefreshKey((k) => k + 1);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null);
        }}
        onConfirm={confirmDelete}
        description="Esta ação não pode ser desfeita. O registro será removido permanentemente."
      />
    </div>
  );
}
