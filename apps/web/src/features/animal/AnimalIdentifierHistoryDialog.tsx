import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowRightLeft,
  CircleAlert,
  Loader2,
  Nfc,
  Pencil,
  Tag,
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
import { animalClient } from "@/lib/clients";
import {
  ApiError,
  type AnimalIdentifierRecord,
  type IdentifierChangePayload,
  type IdentifierKind,
} from "@ifarm/shared";
import { animalIdentifiersQuery, useReloadAnimals } from "./queries";
import { IDENTIFIER_MAX_LENGTH } from "@ifarm/shared";
import {
  AnimalIdentifierCorrectionForm,
  IDENTIFIER_LABELS,
} from "./AnimalIdentifierCorrectionForm";
import type { Commitment } from "@ifarm/shared";
import { CommitmentNotice } from "./CommitmentNotice";
import { formatDate, formatInstant } from "./format";

interface AnimalIdentifierHistoryDialogProps {
  animalId: string;
  /** Operações em aberto do animal, para o aviso de conflito (CommitmentNotice). */
  commitments: Commitment[];
  /**
   * Identificador atual (do cadastro do animal): o painel de troca aparece sem esperar
   * o histórico carregar.
   */
  current: string | null;
  kind: IdentifierKind;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const displayValue = (value: string | null) => value ?? "Removido";

// Troca na hora: o novo valor vira um registro de hoje e aparece no topo do histórico.
function IdentifierChangePanel({
  animalId,
  commitments,
  kind,
  current,
}: {
  animalId: string;
  commitments: Commitment[];
  kind: IdentifierKind;
  current: string | null;
}) {
  const reloadAnimal = useReloadAnimals();
  const label = IDENTIFIER_LABELS[kind];
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const change = useMutation({
    mutationFn: (data: IdentifierChangePayload) =>
      animalClient.changeIdentifier(animalId, kind, data),
    onSuccess: reloadAnimal,
  });
  const saving = change.isPending;

  async function save(newValue: string) {
    setError(null);
    try {
      await change.mutateAsync({ value: newValue, notes });
      toast.success(
        newValue
          ? `${label} trocado para ${newValue}.`
          : `${label} removido do animal.`,
      );
      setValue("");
      setNotes("");
    } catch (e) {
      if (e instanceof ApiError && e.errors?.value) setError(e.errors.value);
      else toast.error((e as Error).message);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    // Eventos do React atravessam o portal do diálogo pela árvore de componentes:
    // não deixa o submit chegar a um formulário da tela de trás.
    e.preventDefault();
    e.stopPropagation();
    if (!value.trim()) {
      setError(`Informe o novo ${label.toLowerCase()}.`);
      return;
    }
    save(value.trim());
  }

  return (
    <div className="space-y-3 rounded-md border border-border bg-muted/40 p-3">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span>
          <span className="text-muted-foreground">Atual: </span>
          <span className="font-medium">{current ?? "nenhum"}</span>
        </span>
        {current && (
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto px-0 text-destructive"
            disabled={saving}
            onClick={() => setConfirmRemove(true)}
          >
            Remover {label.toLowerCase()}
          </Button>
        )}
      </div>
      <CommitmentNotice
        commitments={commitments}
        intent={{ kind: "record", type: kind }}
      />

      <form
        onSubmit={handleSubmit}
        className="grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]"
      >
        <Input
          aria-label={`Novo ${label.toLowerCase()}`}
          placeholder={`Novo ${label.toLowerCase()}`}
          value={value}
          maxLength={IDENTIFIER_MAX_LENGTH[kind]}
          autoComplete="off"
          autoFocus
          aria-invalid={error ? true : undefined}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
        />
        <Input
          aria-label="Observação da troca"
          placeholder="Observação (ex.: perdeu o anterior)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <Button type="submit" disabled={saving}>
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowRightLeft className="size-4" />
          )}
          Trocar
        </Button>
      </form>
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-destructive">
          <CircleAlert className="size-4 shrink-0" /> {error}
        </p>
      )}

      <ConfirmDialog
        open={confirmRemove}
        onOpenChange={setConfirmRemove}
        onConfirm={() => save("")}
        title={`Remover ${label.toLowerCase()}`}
        description={`O animal ficará sem ${label.toLowerCase()} a partir de hoje. A remoção entra no histórico e pode ser desfeita excluindo o registro.`}
        confirmLabel="Remover"
      />
    </div>
  );
}

export function AnimalIdentifierHistoryDialog({
  animalId,
  commitments,
  current,
  kind,
  open,
  onOpenChange,
}: AnimalIdentifierHistoryDialogProps) {
  const reloadAnimal = useReloadAnimals();
  const label = IDENTIFIER_LABELS[kind];
  const Icon = kind === "tag" ? Tag : Nfc;

  const [editing, setEditing] = useState<AnimalIdentifierRecord | null>(null);
  const [cancelling, setCancelling] = useState<AnimalIdentifierRecord | null>(
    null,
  );

  // Histórico só com a janela aberta.
  const { data, isPending, isError } = useQuery({
    ...animalIdentifiersQuery(animalId, kind),
    enabled: open,
  });
  const records = isPending ? null : (data ?? []);
  // Nada carregado: a falha de uma atualização com o histórico na tela é avisada à parte
  // (aviso global), sem trocar a tabela por esta mensagem.
  const loadFailed = isError && !data;

  function handleOpenChange(next: boolean) {
    if (!next) setEditing(null);
    onOpenChange(next);
  }

  const cancel = useMutation({
    mutationFn: (recordId: number) =>
      animalClient.cancelIdentifier(animalId, kind, recordId),
    onSuccess: () => {
      toast.success(`Registro de ${label} excluído.`);
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
            <DialogTitle>{editing ? `Corrigir ${label}` : label}</DialogTitle>
            <DialogDescription>
              {editing
                ? `Registro de ${formatInstant(editing.date)}.`
                : `Troque o ${label.toLowerCase()} ou corrija registros lançados com erro. As alterações são gravadas imediatamente.`}
            </DialogDescription>
          </DialogHeader>

          {!editing && (
            <IdentifierChangePanel
              animalId={animalId}
              commitments={commitments}
              kind={kind}
              current={current}
            />
          )}
          {!editing && (
            <h3 className="-mb-2 text-sm font-medium uppercase text-muted-foreground">
              Histórico
            </h3>
          )}

          {editing ? (
            <AnimalIdentifierCorrectionForm
              key={editing.id}
              animalId={animalId}
              kind={kind}
              record={editing}
              onCancel={() => setEditing(null)}
              onSaved={() => setEditing(null)}
            />
          ) : loadFailed ? (
            <p className="py-8 text-center text-sm text-destructive">
              Não foi possível carregar o histórico.
            </p>
          ) : records === null ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <Icon className="size-10 opacity-30" />
              <p className="text-sm">Nenhum registro de {label}.</p>
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto">
              <Table className="[&_tr]:border-border">
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>{label}</TableHead>
                    <TableHead>Observação</TableHead>
                    <TableHead className="w-0" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((r, index) => (
                    <TableRow key={r.id}>
                      <TableCell>{formatInstant(r.date)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={
                              r.value ? "font-medium" : "text-muted-foreground"
                            }
                          >
                            {displayValue(r.value)}
                          </span>
                          {index === 0 && (
                            <span className="text-xs text-muted-foreground">
                              (atual)
                            </span>
                          )}
                        </div>
                        {r.correctedAt && (
                          <div
                            className="text-xs text-muted-foreground"
                            title={`Corrigido em ${formatDate(r.correctedAt)}`}
                          >
                            {r.originalValue != null
                              ? `corrigido (era ${r.originalValue})`
                              : "corrigido"}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="max-w-56 truncate text-muted-foreground">
                        {r.notes || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title={`Corrigir ${label}`}
                            onClick={() => setEditing(r)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Excluir registro"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setCancelling(r)}
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
        title={`Excluir registro de ${label}`}
        description={
          cancelling
            ? `O registro "${displayValue(cancelling.value)}" de ${formatInstant(cancelling.date)} deixará de aparecer no histórico, e o ${label.toLowerCase()} atual passará a ser o do registro anterior. O registro é mantido para auditoria.`
            : ""
        }
        confirmLabel="Excluir"
        variant="destructive"
      />
    </>
  );
}
