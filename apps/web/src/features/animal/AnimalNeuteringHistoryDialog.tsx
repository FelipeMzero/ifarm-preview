"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CircleAlert,
  Loader2,
  Pencil,
  Plus,
  Scissors,
  Trash2,
  TriangleAlert,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ApiError,
  AnimalNeuteringRecord,
  cancelNeutering,
  createNeutering,
  getNeuterings,
} from "./services";
import { AnimalNeuteringCorrectionForm } from "./AnimalNeuteringCorrectionForm";
import { CommitmentNotice } from "./CommitmentNotice";
import { formatDate } from "./format";

interface AnimalNeuteringHistoryDialogProps {
  animalId: string;
  birthDate?: string | null;
  /** Situação atual do animal (pode ser castrado sem registro, ex.: chegou castrado). */
  neutered: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Chamado após registrar, corrigir ou excluir, para quem abriu atualizar a castração exibida.
  onChanged: () => void;
}

// Indica, abaixo da data, que a castração foi corrigida e quais eram os valores originais.
function NeuteringCorrectionNote({
  neutering,
}: {
  neutering: AnimalNeuteringRecord;
}) {
  if (!neutering.correctedAt) return null;

  const was = [
    neutering.originalDate &&
    formatDate(neutering.originalDate) !== formatDate(neutering.date)
      ? formatDate(neutering.originalDate)
      : null,
    neutering.originalMethod !== neutering.method
      ? (neutering.originalMethod ?? "sem método")
      : null,
  ].filter(Boolean);

  return (
    <div
      className="text-xs text-muted-foreground"
      title={`Corrigida em ${formatDate(neutering.correctedAt)}`}
    >
      {was.length ? `corrigido (era ${was.join(", ")})` : "corrigido"}
    </div>
  );
}

const todayInput = () => new Date().toLocaleDateString("en-CA");

const METHODS = ["Burdizzo", "Cirúrgica", "Elástico"];

// Registro na hora. Se o animal já é castrado, é uma recastração (motivo obrigatório).
function NeuteringRegisterPanel({
  animalId,
  birthDate,
  neutered,
  latest,
  onChanged,
}: {
  animalId: string;
  birthDate?: string | null;
  neutered: boolean;
  latest: AnimalNeuteringRecord | null;
  onChanged: () => void;
}) {
  const [date, setDate] = useState(todayInput);
  const [method, setMethod] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    // Eventos do React atravessam o portal do diálogo pela árvore de componentes:
    // não deixa o submit chegar a um formulário da tela de trás.
    e.preventDefault();
    e.stopPropagation();
    if (neutered && !notes.trim()) {
      setErrors({ notes: "Informe o motivo da recastração." });
      return;
    }

    setSaving(true);
    setErrors({});
    try {
      await createNeutering(animalId, { date, method, notes });
      toast.success(
        neutered ? "Recastração registrada." : "Castração registrada.",
      );
      setDate(todayInput());
      setMethod("");
      setNotes("");
      onChanged();
    } catch (err) {
      if (err instanceof ApiError && err.errors) setErrors(err.errors);
      else toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const error = errors.date ?? errors.method ?? errors.notes;

  return (
    <div className="space-y-3 rounded-md border border-border bg-muted/40 p-3">
      <p className="text-sm">
        <span className="text-muted-foreground">Situação: </span>
        <span className="font-medium">
          {!neutered
            ? "não castrado"
            : latest
              ? `castrado em ${formatDate(latest.date)}${latest.method ? ` (${latest.method})` : ""}`
              : "castrado (sem registro)"}
        </span>
      </p>
      {neutered && (
        <p className="flex items-start gap-1.5 text-xs text-warning">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
          Registre uma nova castração só se o procedimento precisou ser refeito,
          informando o motivo.
        </p>
      )}
      <CommitmentNotice
        animalId={animalId}
        intent={{ kind: "record", type: "neutering" }}
      />

      <form
        onSubmit={handleSubmit}
        className="grid gap-2 sm:grid-cols-[10rem_9rem_1fr_auto]"
      >
        <Input
          aria-label="Data da castração"
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
          aria-label="Método"
          placeholder="Método"
          list="neutering-register-methods"
          value={method}
          maxLength={50}
          onChange={(e) => setMethod(e.target.value)}
        />
        <Input
          aria-label={neutered ? "Motivo da recastração" : "Observação"}
          placeholder={
            neutered ? "Motivo da recastração (obrigatório)" : "Observação"
          }
          value={notes}
          aria-invalid={errors.notes ? true : undefined}
          onChange={(e) => {
            setNotes(e.target.value);
            setErrors({});
          }}
        />
        <Button type="submit" disabled={saving || !date}>
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          Registrar
        </Button>
        <datalist id="neutering-register-methods">
          {METHODS.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
      </form>
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-destructive">
          <CircleAlert className="size-4 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}

export function AnimalNeuteringHistoryDialog({
  animalId,
  birthDate,
  neutered,
  open,
  onOpenChange,
  onChanged,
}: AnimalNeuteringHistoryDialogProps) {
  const [neuterings, setNeuterings] = useState<AnimalNeuteringRecord[] | null>(
    null,
  );
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [editing, setEditing] = useState<AnimalNeuteringRecord | null>(null);
  const [cancelling, setCancelling] = useState<AnimalNeuteringRecord | null>(
    null,
  );

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    getNeuterings(animalId)
      .then((data) => {
        if (cancelled) return;
        setNeuterings(data);
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
      setNeuterings(null);
      setLoadFailed(false);
    }
    onOpenChange(next);
  }

  function afterChange() {
    setEditing(null);
    setReloadKey((k) => k + 1);
    onChanged();
  }

  async function handleCancel(keepNeutered?: boolean) {
    if (!cancelling) return;
    try {
      await cancelNeutering(animalId, cancelling.id, keepNeutered);
      toast.success("Castração excluída.");
      afterChange();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setCancelling(null);
    }
  }

  // Excluir a única castração registrada exige decidir se o animal continua castrado.
  const isLastOne = neuterings?.length === 1;
  // Lista vem da mais recente para a mais antiga.
  const isRecastration = (n: AnimalNeuteringRecord) =>
    neuterings != null && neuterings.indexOf(n) < neuterings.length - 1;

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Corrigir Castração" : "Castração"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? `Castração de ${formatDate(editing.date)}.`
                : "Registre a castração ou corrija as lançadas com erro. As alterações são gravadas imediatamente."}
            </DialogDescription>
          </DialogHeader>

          {!editing && neuterings !== null && (
            <>
              <NeuteringRegisterPanel
                animalId={animalId}
                birthDate={birthDate}
                neutered={neutered}
                latest={neuterings[0] ?? null}
                onChanged={afterChange}
              />
              <h3 className="-mb-2 text-sm font-medium uppercase text-muted-foreground">
                Histórico
              </h3>
            </>
          )}

          {editing ? (
            <AnimalNeuteringCorrectionForm
              key={editing.id}
              animalId={animalId}
              neutering={editing}
              birthDate={birthDate}
              onCancel={() => setEditing(null)}
              onSaved={afterChange}
            />
          ) : loadFailed ? (
            <p className="py-8 text-center text-sm text-destructive">
              Não foi possível carregar as castrações.
            </p>
          ) : neuterings === null ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : neuterings.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <Scissors className="size-10 opacity-30" />
              <p className="text-sm">Nenhuma castração registrada.</p>
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto">
              <Table className="[&_tr]:border-border">
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Observação</TableHead>
                    <TableHead className="w-0" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {neuterings.map((n) => (
                    <TableRow key={n.id}>
                      <TableCell>
                        <div className="font-medium">
                          {formatDate(n.date)}
                          {isRecastration(n) && (
                            <span className="ml-2 text-xs font-normal text-muted-foreground">
                              recastração
                            </span>
                          )}
                        </div>
                        <NeuteringCorrectionNote neutering={n} />
                      </TableCell>
                      <TableCell>{n.method || "—"}</TableCell>
                      <TableCell className="max-w-56 truncate text-muted-foreground">
                        {n.notes || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Corrigir castração"
                            onClick={() => setEditing(n)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Excluir castração"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setCancelling(n)}
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

      <AlertDialog
        open={cancelling !== null}
        onOpenChange={(next) => !next && setCancelling(null)}
      >
        {/* Com três botões (última castração) o diálogo padrão fica estreito. */}
        <AlertDialogContent
          className={isLastOne ? "data-[size=default]:sm:max-w-md" : undefined}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir castração</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelling
                ? `A castração de ${formatDate(cancelling.date)} deixará de aparecer no histórico. O registro é mantido para auditoria.`
                : null}
              {isLastOne &&
                " É a única castração registrada: o animal continua castrado (por exemplo, se já chegou castrado)?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="border-border">
            <AlertDialogCancel variant="secondary">Voltar</AlertDialogCancel>
            {isLastOne ? (
              <>
                <AlertDialogAction
                  variant="outline"
                  onClick={() => handleCancel(true)}
                >
                  Sim, castrado
                </AlertDialogAction>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() => handleCancel(false)}
                >
                  Não castrado
                </AlertDialogAction>
              </>
            ) : (
              <AlertDialogAction
                variant="destructive"
                onClick={() => handleCancel()}
              >
                Excluir
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
