import { useState } from "react";
import { useCurrentProperty } from "@/features/shell/useCurrentProperty";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { animalClient } from "@/lib/clients";
import {
  ApiError,
  type AnimalNeuteringRecord,
  type NeuteringCreatePayload,
  nowInZone,
  formatDateTime,
  formatDay,
} from "@ifarm/shared";
import { AnimalNeuteringCorrectionForm } from "./AnimalNeuteringCorrectionForm";
import { neuteringTechniqueListQuery } from "@/features/neutering-technique/queries";
import { type NeuteringTechnique } from "@ifarm/shared";
import { animalNeuteringsQuery, useReloadAnimals } from "./queries";
import { techniqueItems } from "@/features/neutering-technique/items";
import { SelectField } from "@/components/our/SelectField";
import type { Commitment } from "@ifarm/shared";
import { CommitmentNotice } from "./CommitmentNotice";

interface AnimalNeuteringHistoryDialogProps {
  animalId: string;
  /** Operações em aberto do animal, para o aviso de conflito (CommitmentNotice). */
  commitments: Commitment[];
  birthDate?: string | null;
  /** Situação atual do animal (pode ser castrado sem registro, ex.: chegou castrado). */
  neutered: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
    formatDateTime(neutering.originalDate) !== formatDateTime(neutering.date)
      ? formatDateTime(neutering.originalDate)
      : null,
    neutering.originalTechniqueId !== neutering.techniqueId
      ? (neutering.originalTechniqueName ?? "sem técnica")
      : null,
  ].filter(Boolean);

  return (
    <div
      className="text-xs text-muted-foreground"
      title={`Corrigida em ${formatDay(neutering.correctedAt)}`}
    >
      {was.length ? `corrigido (era ${was.join(", ")})` : "corrigido"}
    </div>
  );
}

// Registro na hora. Se o animal já é castrado, é uma recastração (motivo obrigatório).
function NeuteringRegisterPanel({
  animalId,
  commitments,
  birthDate,
  neutered,
  latest,
  techniques,
}: {
  animalId: string;
  commitments: Commitment[];
  birthDate?: string | null;
  neutered: boolean;
  techniques: NeuteringTechnique[];
  // undefined = histórico ainda carregando (o painel já aparece; só este texto espera).
  latest: AnimalNeuteringRecord | null | undefined;
}) {
  const { timeZone } = useCurrentProperty();
  const reloadAnimal = useReloadAnimals();
  const [date, setDate] = useState(() => nowInZone(timeZone));
  const [techniqueId, setTechniqueId] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const register = useMutation({
    mutationFn: (data: NeuteringCreatePayload) =>
      animalClient.createNeutering(animalId, data),
    onSuccess: reloadAnimal,
  });
  const saving = register.isPending;

  async function handleSubmit(e: React.FormEvent) {
    // Eventos do React atravessam o portal do diálogo pela árvore de componentes:
    // não deixa o submit chegar a um formulário da tela de trás.
    e.preventDefault();
    e.stopPropagation();
    if (!techniqueId) {
      setErrors({ techniqueId: "Informe a técnica." });
      return;
    }
    if (neutered && !notes.trim()) {
      setErrors({ notes: "Informe o motivo da recastração." });
      return;
    }

    setErrors({});
    try {
      await register.mutateAsync({ date, techniqueId, notes });
      toast.success(
        neutered ? "Recastração registrada." : "Castração registrada.",
      );
      setDate(nowInZone(timeZone));
      setTechniqueId("");
      setNotes("");
    } catch (err) {
      if (err instanceof ApiError && err.errors) setErrors(err.errors);
      else toast.error((err as Error).message);
    }
  }

  const error = errors.date ?? errors.techniqueId ?? errors.notes;

  return (
    <div className="space-y-3 rounded-md border border-border bg-muted/40 p-3">
      <div className="text-sm">
        <span className="text-muted-foreground">Situação: </span>
        {neutered && latest === undefined ? (
          <Skeleton className="inline-block h-4 w-40 align-middle" />
        ) : (
          <span className="font-medium">
            {!neutered
              ? "não castrado"
              : latest
                ? `castrado em ${formatDateTime(latest.date)}${latest.techniqueName ? ` (${latest.techniqueName})` : ""}`
                : "castrado (sem registro)"}
          </span>
        )}
      </div>
      {neutered && (
        <p className="flex items-start gap-1.5 text-xs text-warning">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
          Registre uma nova castração só se o procedimento precisou ser refeito,
          informando o motivo.
        </p>
      )}
      <CommitmentNotice
        commitments={commitments}
        intent={{ kind: "record", type: "neutering" }}
      />

      <form
        onSubmit={handleSubmit}
        className="grid gap-2 sm:grid-cols-[10rem_9rem_1fr_auto]"
      >
        <Input
          aria-label="Data da castração"
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
        <SelectField
          aria-label="Técnica"
          placeholder="Técnica"
          value={techniqueId}
          items={techniqueItems(techniques)}
          aria-invalid={errors.techniqueId ? true : undefined}
          onValueChange={(value) => {
            setTechniqueId(value);
            setErrors({});
          }}
          className="w-full min-w-0"
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
  commitments,
  birthDate,
  neutered,
  open,
  onOpenChange,
}: AnimalNeuteringHistoryDialogProps) {
  const reloadAnimal = useReloadAnimals();
  const [editing, setEditing] = useState<AnimalNeuteringRecord | null>(null);
  const [cancelling, setCancelling] = useState<AnimalNeuteringRecord | null>(
    null,
  );

  // Técnicas cadastradas (inclui inativas, para exibir a gravada numa correção) e o histórico,
  // só com a janela aberta (o histórico vem da mais recente para a mais antiga).
  const { data: techniques = [] } = useQuery({
    ...neuteringTechniqueListQuery(),
    enabled: open,
  });
  const { data, isPending, isError } = useQuery({
    ...animalNeuteringsQuery(animalId),
    enabled: open,
  });
  const neuterings = isPending ? null : (data ?? []);
  // Nada carregado: a falha de uma atualização com o histórico na tela é avisada à parte
  // (aviso global), sem trocar a tabela por esta mensagem.
  const loadFailed = isError && !data;

  function handleOpenChange(next: boolean) {
    if (!next) setEditing(null);
    onOpenChange(next);
  }

  const cancel = useMutation({
    mutationFn: ({
      id,
      keepNeutered,
    }: {
      id: number;
      keepNeutered?: boolean;
    }) => animalClient.cancelNeutering(animalId, id, keepNeutered),
    onSuccess: () => {
      toast.success("Castração excluída.");
      setEditing(null);
      return reloadAnimal();
    },
    onError: (e) => toast.error(e.message),
    onSettled: () => setCancelling(null),
  });

  function handleCancel(keepNeutered?: boolean) {
    if (cancelling) cancel.mutate({ id: cancelling.id, keepNeutered });
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
                ? `Castração de ${formatDateTime(editing.date)}.`
                : "Registre a castração ou corrija as lançadas com erro. As alterações são gravadas imediatamente."}
            </DialogDescription>
          </DialogHeader>

          {!editing && (
            <>
              <NeuteringRegisterPanel
                animalId={animalId}
                commitments={commitments}
                birthDate={birthDate}
                neutered={neutered}
                latest={
                  neuterings === null ? undefined : (neuterings[0] ?? null)
                }
                techniques={techniques}
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
              techniques={techniques}
              birthDate={birthDate}
              onCancel={() => setEditing(null)}
              onSaved={() => setEditing(null)}
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
                    <TableHead>Técnica</TableHead>
                    <TableHead>Observação</TableHead>
                    <TableHead className="w-0" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {neuterings.map((n) => (
                    <TableRow key={n.id}>
                      <TableCell>
                        <div className="font-medium">
                          {formatDateTime(n.date)}
                          {isRecastration(n) && (
                            <span className="ml-2 text-xs font-normal text-muted-foreground">
                              recastração
                            </span>
                          )}
                        </div>
                        <NeuteringCorrectionNote neutering={n} />
                      </TableCell>
                      <TableCell>{n.techniqueName || "—"}</TableCell>
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
                ? `A castração de ${formatDateTime(cancelling.date)} deixará de aparecer no histórico. O registro é mantido para auditoria.`
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
