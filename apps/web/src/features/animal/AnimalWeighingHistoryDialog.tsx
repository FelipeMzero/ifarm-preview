"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Scale, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { AnimalWeighing, cancelWeighing, getWeighings } from "./services";
import { AnimalWeighingCorrectionForm } from "./AnimalWeighingCorrectionForm";
import { WeighingCorrectionNote } from "./WeighingCorrectionNote";
import { formatDate, formatKg } from "./format";

interface AnimalWeighingHistoryDialogProps {
  animalId: string;
  birthDate?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Chamado após corrigir ou excluir, para quem abriu atualizar o peso atual.
  onChanged: () => void;
}

export function AnimalWeighingHistoryDialog({
  animalId,
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
            <DialogTitle>
              {editing ? "Corrigir Pesagem" : "Histórico de Pesagens"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? `Pesagem de ${formatDate(editing.date)}.`
                : "Corrija ou exclua pesagens lançadas com erro. As alterações são gravadas imediatamente."}
            </DialogDescription>
          </DialogHeader>

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
              <Table>
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
