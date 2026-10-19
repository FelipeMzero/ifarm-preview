"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CircleAlert,
  Loader2,
  Pencil,
  Plus,
  Scale,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/our/ConfirmDialog";
import {
  ApiError,
  AnimalWeighing,
  cancelWeighing,
  createWeighing,
  getWeighings,
} from "./services";
import { AnimalWeighingCorrectionForm } from "./AnimalWeighingCorrectionForm";
import { WeighingCorrectionNote } from "./WeighingCorrectionNote";
import type { Commitment } from "@ifarm/shared";
import { CommitmentNotice } from "./CommitmentNotice";
import { formatDate, formatKg } from "./format";

interface AnimalWeighingHistoryDialogProps {
  animalId: string;
  /** Operações em aberto do animal, para o aviso de conflito (CommitmentNotice). */
  commitments: Commitment[];
  birthDate?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Chamado após corrigir ou excluir, para quem abriu atualizar o peso atual.
  onChanged: () => void;
}

const todayInput = () => new Date().toLocaleDateString("en-CA");

// Registro na hora: a nova pesagem entra no histórico e o peso atual é recalculado.
function WeighingRegisterPanel({
  animalId,
  commitments,
  birthDate,
  latest,
  onChanged,
}: {
  animalId: string;
  commitments: Commitment[];
  birthDate?: string | null;
  // undefined = histórico ainda carregando (o painel já aparece; só este texto espera).
  latest: AnimalWeighing | null | undefined;
  onChanged: () => void;
}) {
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(todayInput);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    // Eventos do React atravessam o portal do diálogo pela árvore de componentes:
    // não deixa o submit chegar a um formulário da tela de trás.
    e.preventDefault();
    e.stopPropagation();
    if (!(Number(weight) > 0)) {
      setErrors({ weightKg: "Informe um peso maior que zero." });
      return;
    }

    setSaving(true);
    setErrors({});
    try {
      await createWeighing(animalId, {
        weightKg: weight,
        date: date === todayInput() ? undefined : date,
        notes,
      });
      toast.success(`Pesagem de ${formatKg(Number(weight))} registrada.`);
      setWeight("");
      setNotes("");
      setDate(todayInput());
      onChanged();
    } catch (err) {
      if (err instanceof ApiError && err.errors) setErrors(err.errors);
      else toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const error = errors.weightKg ?? errors.date ?? errors.notes;

  return (
    <div className="space-y-3 rounded-md border border-border bg-muted/40 p-3">
      <div className="text-sm">
        <span className="text-muted-foreground">Atual: </span>
        {latest === undefined ? (
          <Skeleton className="inline-block h-4 w-32 align-middle" />
        ) : latest ? (
          <>
            <span className="font-medium">{formatKg(latest.weightKg)}</span>
            <span className="text-muted-foreground">
              {" "}
              em {formatDate(latest.date)}
            </span>
          </>
        ) : (
          <span className="font-medium">sem pesagem</span>
        )}
      </div>
      <CommitmentNotice
        commitments={commitments}
        intent={{ kind: "record", type: "weighing" }}
      />

      <form
        onSubmit={handleSubmit}
        className="grid gap-2 sm:grid-cols-[8rem_10rem_1fr_auto]"
      >
        <Input
          aria-label="Peso (kg)"
          placeholder="Peso (kg)"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          value={weight}
          autoFocus
          aria-invalid={errors.weightKg ? true : undefined}
          onChange={(e) => {
            setWeight(e.target.value);
            setErrors({});
          }}
        />
        <Input
          aria-label="Data da pesagem"
          type="date"
          value={date}
          min={birthDate ?? undefined}
          max={todayInput()}
          aria-invalid={errors.date ? true : undefined}
          onChange={(e) => {
            setDate(e.target.value);
            setErrors({});
          }}
        />
        <Input
          aria-label="Observação da pesagem"
          placeholder="Observação"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <Button type="submit" disabled={saving}>
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          Registrar
        </Button>
      </form>
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-destructive">
          <CircleAlert className="size-4 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}

export function AnimalWeighingHistoryDialog({
  animalId,
  commitments,
  birthDate,
  open,
  onOpenChange,
  onChanged,
}: AnimalWeighingHistoryDialogProps) {
  const [weighings, setWeighings] = useState<AnimalWeighing[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [editing, setEditing] = useState<AnimalWeighing | null>(null);
  const [cancelling, setCancelling] = useState<AnimalWeighing | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    getWeighings(animalId)
      .then((data) => {
        if (cancelled) return;
        setWeighings([...data].reverse());
        setLoadFailed(false);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [open, animalId, reloadKey]);

  function handleOpenChange(next: boolean) {
    if (!next) {
      setEditing(null);
      setWeighings(null);
      setLoadFailed(false);
    }
    onOpenChange(next);
  }

  function afterChange() {
    setEditing(null);
    setReloadKey((k) => k + 1);
    onChanged();
  }

  async function handleCancel() {
    if (!cancelling) return;
    try {
      await cancelWeighing(animalId, cancelling.id);
      toast.success("Pesagem excluída.");
      afterChange();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setCancelling(null);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Corrigir Pesagem" : "Peso"}</DialogTitle>
            <DialogDescription>
              {editing
                ? `Pesagem de ${formatDate(editing.date)}.`
                : "Registre uma pesagem ou corrija as lançadas com erro. As alterações são gravadas imediatamente."}
            </DialogDescription>
          </DialogHeader>

          {!editing && (
            <>
              <WeighingRegisterPanel
                animalId={animalId}
                commitments={commitments}
                birthDate={birthDate}
                latest={weighings === null ? undefined : (weighings[0] ?? null)}
                onChanged={afterChange}
              />
              <h3 className="-mb-2 text-sm font-medium uppercase text-muted-foreground">
                Histórico
              </h3>
            </>
          )}

          {editing ? (
            <AnimalWeighingCorrectionForm
              key={editing.id}
              animalId={animalId}
              weighing={editing}
              birthDate={birthDate}
              onCancel={() => setEditing(null)}
              onSaved={afterChange}
            />
          ) : loadFailed ? (
            <p className="py-8 text-center text-sm text-destructive">
              Não foi possível carregar as pesagens.
            </p>
          ) : weighings === null ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : weighings.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <Scale className="size-10 opacity-30" />
              <p className="text-sm">Nenhuma pesagem registrada.</p>
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto">
              <Table className="[&_tr]:border-border">
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Peso</TableHead>
                    <TableHead>Observação</TableHead>
                    <TableHead className="w-0" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {weighings.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell>{formatDate(w.date)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        <div className="font-medium">
                          {formatKg(w.weightKg)}
                        </div>
                        <WeighingCorrectionNote weighing={w} />
                      </TableCell>
                      <TableCell className="max-w-56 truncate text-muted-foreground">
                        {w.notes || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Corrigir pesagem"
                            onClick={() => setEditing(w)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Excluir pesagem"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setCancelling(w)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={cancelling !== null}
        onOpenChange={(next) => !next && setCancelling(null)}
        onConfirm={handleCancel}
        title="Excluir pesagem"
        description={
          cancelling
            ? `A pesagem de ${formatKg(cancelling.weightKg)} em ${formatDate(cancelling.date)} deixará de aparecer no histórico e nos cálculos. O registro é mantido para auditoria.`
            : ""
        }
        confirmLabel="Excluir"
        variant="destructive"
      />
    </>
  );
}
