import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { Textarea } from "@/components/ui/textarea";
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
import { animalClient } from "@/lib/clients";
import {
  ApiError,
  type AnimalWeighing,
  nowInZone,
  type WeighingCreatePayload,
  formatDateTime,
  type BrTimeZone,
} from "@ifarm/shared";
import { animalWeighingsQuery, useReloadAnimals } from "./queries";
import { AnimalWeighingCorrectionForm } from "./AnimalWeighingCorrectionForm";
import { WeighingCorrectionNote } from "./WeighingCorrectionNote";
import type { Commitment } from "@ifarm/shared";
import { CommitmentNotice } from "./CommitmentNotice";
import { formatKg } from "./format";

interface AnimalWeighingHistoryDialogProps {
  animalId: string;
  /** Fuso da propriedade do animal: o "agora" sugerido e o limite das datas. */
  timeZone: BrTimeZone;
  /** Operações em aberto do animal, para o aviso de conflito (CommitmentNotice). */
  commitments: Commitment[];
  birthDate?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Registro na hora: a nova pesagem entra no histórico e o peso atual é recalculado.
function WeighingRegisterPanel({
  animalId,
  timeZone,
  commitments,
  birthDate,
  latest,
}: {
  animalId: string;
  timeZone: BrTimeZone;
  commitments: Commitment[];
  birthDate?: string | null;
  // undefined = histórico ainda carregando (o painel já aparece; só este texto espera).
  latest: AnimalWeighing | null | undefined;
}) {
  const reloadAnimal = useReloadAnimals();
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(() => nowInZone(timeZone));
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const register = useMutation({
    mutationFn: (data: WeighingCreatePayload) =>
      animalClient.createWeighing(animalId, data),
    onSuccess: reloadAnimal,
  });

  async function handleSubmit(e: React.FormEvent) {
    // Eventos do React atravessam o portal do diálogo pela árvore de componentes:
    // não deixa o submit chegar a um formulário da tela de trás.
    e.preventDefault();
    e.stopPropagation();
    if (!(Number(weight) > 0)) {
      setErrors({ weightKg: "Informe um peso maior que zero." });
      return;
    }

    setErrors({});
    try {
      await register.mutateAsync({ weightKg: weight, date, notes });
      toast.success(`Pesagem de ${formatKg(Number(weight))} registrada.`);
      setWeight("");
      setNotes("");
      setDate(nowInZone(timeZone));
    } catch (err) {
      if (err instanceof ApiError && err.errors) setErrors(err.errors);
      else toast.error((err as Error).message);
    }
  }
  const saving = register.isPending;

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
              em {formatDateTime(latest.date)}
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
        className="grid gap-2 sm:grid-cols-[8rem_1fr]"
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
          type="datetime-local"
          value={date}
          min={birthDate ? `${birthDate}T00:00` : undefined}
          max={nowInZone(timeZone)}
          aria-invalid={errors.date ? true : undefined}
          onChange={(e) => {
            setDate(e.target.value);
            setErrors({});
          }}
        />
        <Textarea
          aria-label="Observação da pesagem"
          placeholder="Observação"
          className="resize-none sm:col-span-2"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <Button
          type="submit"
          disabled={saving}
          className="sm:col-span-2 sm:justify-self-end"
        >
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
  timeZone,
  commitments,
  birthDate,
  open,
  onOpenChange,
}: AnimalWeighingHistoryDialogProps) {
  const reloadAnimal = useReloadAnimals();
  const [editing, setEditing] = useState<AnimalWeighing | null>(null);
  const [cancelling, setCancelling] = useState<AnimalWeighing | null>(null);

  // Histórico só com a janela aberta; a mais recente primeiro.
  const { data, isPending, isError } = useQuery({
    ...animalWeighingsQuery(animalId),
    enabled: open,
    select: (list) => [...list].reverse(),
  });
  const weighings = isPending ? null : (data ?? []);
  const loadFailed = isError && !data;

  function handleOpenChange(next: boolean) {
    if (!next) setEditing(null);
    onOpenChange(next);
  }

  const cancel = useMutation({
    mutationFn: (weighingId: number) =>
      animalClient.cancelWeighing(animalId, weighingId),
    onSuccess: () => {
      toast.success("Pesagem excluída.");
      setEditing(null);
      return reloadAnimal();
    },
    onError: (e) => toast.error(e.message),
    onSettled: () => setCancelling(null),
  });

  function handleCancel() {
    if (cancelling) cancel.mutate(cancelling.id);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Corrigir Pesagem" : "Peso"}</DialogTitle>
            <DialogDescription>
              {editing
                ? `Pesagem de ${formatDateTime(editing.date)}.`
                : "Registre uma pesagem ou corrija as lançadas com erro. As alterações são gravadas imediatamente."}
            </DialogDescription>
          </DialogHeader>

          {!editing && (
            <>
              <WeighingRegisterPanel
                animalId={animalId}
                timeZone={timeZone}
                commitments={commitments}
                birthDate={birthDate}
                latest={weighings === null ? undefined : (weighings[0] ?? null)}
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
              timeZone={timeZone}
              weighing={editing}
              birthDate={birthDate}
              onCancel={() => setEditing(null)}
              onSaved={() => setEditing(null)}
            />
          ) : loadFailed ? (
            // Nada carregado: a falha de uma atualização com o histórico na tela é avisada à
            // parte (aviso global), sem trocar a tabela por esta mensagem.
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
                      <TableCell>{formatDateTime(w.date)}</TableCell>
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
            ? `A pesagem de ${formatKg(cancelling.weightKg)} em ${formatDateTime(cancelling.date)} deixará de aparecer no histórico e nos cálculos. O registro é mantido para auditoria.`
            : ""
        }
        confirmLabel="Excluir"
        variant="destructive"
      />
    </>
  );
}
