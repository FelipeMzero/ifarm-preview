"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowDownAZ, ArrowUpAZ, Check, Pencil, Plus, Power, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/our/ConfirmDialog";

export type InlineEditableColumn<T> = {
  key: Extract<keyof T, string>;
  label: string;
  placeholder?: string;
  /** @default true */
  editable?: boolean;
};

type InlineEditableListProps<T extends { id: string | number }> = {
  items: T[];
  columns: InlineEditableColumn<T>[];
  onCreate: (values: Record<string, string>) => Promise<void>;
  onUpdate: (id: T["id"], values: Record<string, string>) => Promise<void>;
  onDelete: (id: T["id"]) => Promise<void>;
  itemLabel: string;
  /** Se informado (junto com onToggleActive), exibe um badge Ativo/Inativo e um botão de alternância por linha. */
  isActive?: (item: T) => boolean;
  onToggleActive?: (id: T["id"]) => Promise<void>;
};

export function InlineEditableList<T extends { id: string | number }>({
  items,
  columns,
  onCreate,
  onUpdate,
  onDelete,
  itemLabel,
  isActive,
  onToggleActive,
}: InlineEditableListProps<T>) {
  const editableColumns = columns.filter((column) => column.editable !== false);
  const sortKey = columns[0]?.key;

  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);

  const [newValues, setNewValues] = useState<Record<string, string>>({});
  const [isCreating, setIsCreating] = useState(false);

  const [editingId, setEditingId] = useState<T["id"] | null>(null);
  const [editingValues, setEditingValues] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<T["id"] | null>(null);

  const [deletingId, setDeletingId] = useState<T["id"] | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const firstEditingInputRef = useRef<HTMLInputElement | null>(null);

  const visibleItems = useMemo(() => {
    const filtered = search
      ? items.filter((item) =>
          columns.some((column) => String(item[column.key] ?? "").toLowerCase().includes(search.toLowerCase()))
        )
      : items;

    if (!sortKey) return filtered;

    return [...filtered].sort((a, b) => {
      const result = String(a[sortKey] ?? "").localeCompare(String(b[sortKey] ?? ""));
      return sortAsc ? result : -result;
    });
  }, [items, columns, search, sortKey, sortAsc]);

  async function handleCreate() {
    if (isCreating || editableColumns.some((column) => !newValues[column.key]?.trim())) return;

    setIsCreating(true);
    try {
      await onCreate(newValues);
      setNewValues({});
    } catch (e) {
      toast.error((e as Error).message || `Não foi possível criar ${itemLabel}.`);
    } finally {
      setIsCreating(false);
    }
  }

  function startEditing(item: T) {
    setEditingId(item.id);
    setEditingValues(
      Object.fromEntries(editableColumns.map((column) => [column.key, String(item[column.key] ?? "")]))
    );
    requestAnimationFrame(() => firstEditingInputRef.current?.select());
  }

  function cancelEditing() {
    setEditingId(null);
    setEditingValues({});
  }

  async function handleUpdate(id: T["id"]) {
    if (editableColumns.some((column) => !editingValues[column.key]?.trim())) return;

    setSavingId(id);
    try {
      await onUpdate(id, editingValues);
      setEditingId(null);
      setEditingValues({});
    } catch (e) {
      toast.error((e as Error).message || `Não foi possível salvar ${itemLabel}.`);
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete() {
    if (deletingId == null) return;

    setIsDeleting(true);
    try {
      await onDelete(deletingId);
      setDeletingId(null);
    } catch (e) {
      toast.error((e as Error).message || `Não foi possível excluir ${itemLabel}.`);
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleToggleActive(id: T["id"]) {
    if (!onToggleActive) return;

    try {
      await onToggleActive(id);
    } catch (e) {
      toast.error((e as Error).message || `Não foi possível atualizar ${itemLabel}.`);
    }
  }

  return (
    <div className="w-full max-w-2xl space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={`Buscar ${itemLabel}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          title={sortAsc ? "Ordenar Z-A" : "Ordenar A-Z"}
          onClick={() => setSortAsc((v) => !v)}
        >
          {sortAsc ? <ArrowDownAZ className="size-4" /> : <ArrowUpAZ className="size-4" />}
        </Button>
      </div>

      <div className="rounded-md border border-border bg-card overflow-hidden">
        {columns.length > 1 && (
          <div className="flex items-center gap-2 border-b border-border bg-muted p-2 text-xs text-muted-foreground">
            {columns.map((column) => (
              <span key={column.key} className="flex-1 truncate">{column.label}</span>
            ))}
            <span className="w-16 shrink-0" />
          </div>
        )}

        <div className="flex items-center gap-2 border-b border-border p-2">
          {editableColumns.map((column) => (
            <Input
              key={column.key}
              placeholder={column.placeholder ?? column.label}
              value={newValues[column.key] ?? ""}
              disabled={isCreating}
              onChange={(e) => setNewValues((prev) => ({ ...prev, [column.key]: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          ))}
          <Button
            type="button"
            size="icon"
            disabled={isCreating || editableColumns.some((column) => !newValues[column.key]?.trim())}
            onClick={handleCreate}
          >
            <Plus className="size-4" />
          </Button>
        </div>

        <div className="max-h-72 overflow-y-auto">
          {visibleItems.length === 0 ? (
            <p className="h-24 flex items-center justify-center text-center text-sm text-muted-foreground">
              Nenhum resultado encontrado.
            </p>
          ) : (
            visibleItems.map((item) => {
              const isEditing = editingId === item.id;
              const isSaving = savingId === item.id;

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-2 border-b border-border p-2 last:border-b-0 hover:bg-accent/40"
                >
                  {columns.map((column, index) =>
                    isEditing && column.editable !== false ? (
                      <Input
                        key={column.key}
                        ref={index === 0 ? firstEditingInputRef : undefined}
                        value={editingValues[column.key] ?? ""}
                        disabled={isSaving}
                        onChange={(e) => setEditingValues((prev) => ({ ...prev, [column.key]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleUpdate(item.id);
                          if (e.key === "Escape") cancelEditing();
                        }}
                      />
                    ) : (
                      <span key={column.key} className="flex-1 truncate text-sm">
                        {String(item[column.key] ?? "—")}
                      </span>
                    )
                  )}

                  {!isEditing && isActive && (
                    <Badge variant={isActive(item) ? "default" : "outline"} className="shrink-0">
                      {isActive(item) ? "Ativo" : "Inativo"}
                    </Badge>
                  )}

                  {isEditing ? (
                    <>
                      <Button variant="ghost" size="icon-sm" disabled={isSaving} onClick={() => handleUpdate(item.id)}>
                        <Check className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" disabled={isSaving} onClick={cancelEditing}>
                        <X className="size-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      {onToggleActive && isActive && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title={isActive(item) ? "Desativar" : "Ativar"}
                          onClick={() => handleToggleActive(item.id)}
                        >
                          <Power className="size-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon-sm" title="Editar" onClick={() => startEditing(item)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Excluir"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeletingId(item.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deletingId != null}
        onOpenChange={(open) => !open && !isDeleting && setDeletingId(null)}
        onConfirm={handleDelete}
        description="Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita."
      />
    </div>
  );
}
