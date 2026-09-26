"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Scissors, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
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
  AnimalNeuteringRecord,
  cancelNeutering,
  getNeuterings,
} from "./services";
import { AnimalNeuteringCorrectionForm } from "./AnimalNeuteringCorrectionForm";
import { formatDate } from "./format";

interface AnimalNeuteringHistoryDialogProps {
  animalId: string;
  birthDate?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Chamado após corrigir ou excluir, para quem abriu atualizar a castração exibida.
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

export function AnimalNeuteringHistoryDialog({
  animalId,
  birthDate,
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
              {editing ? "Corrigir Castração" : "Histórico de Castrações"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? `Castração de ${formatDate(editing.date)}.`
                : "Corrija ou exclua castrações lançadas com erro. As alterações são gravadas imediatamente."}
            </DialogDescription>
          </DialogHeader>

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
              <Table>
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
