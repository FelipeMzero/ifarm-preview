import { useCurrentProperty } from "@/features/shell/useCurrentProperty";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog";
import { FormField } from "@/components/our/FormField";
import { FieldRow } from "@/components/our/FieldRow";
import { nowInZone, toDateTimeInput } from "@ifarm/shared";
import { animalClient } from "@/lib/clients";
import { applyServerErrors } from "@/lib/form-errors";
import { useReloadAnimals } from "./queries";
import {
  type AnimalIdentifierRecord,
  IDENTIFIER_MAX_LENGTH,
  identifierCorrectionSchemaFor,
  type IdentifierCorrectionPayload,
  type IdentifierKind,
} from "@ifarm/shared";

export const IDENTIFIER_LABELS: Record<IdentifierKind, string> = {
  tag: "Brinco",
  rfid: "RFID",
};

type FormData = IdentifierCorrectionPayload;

// yyyy-mm-dd no fuso local, formato do input de data

interface AnimalIdentifierCorrectionFormProps {
  animalId: string;
  kind: IdentifierKind;
  record: AnimalIdentifierRecord;
  onCancel: () => void;
  onSaved: () => void;
}

export function AnimalIdentifierCorrectionForm({
  animalId,
  kind,
  record,
  onCancel,
  onSaved,
}: AnimalIdentifierCorrectionFormProps) {
  const { timeZone } = useCurrentProperty();
  const label = IDENTIFIER_LABELS[kind];
  const form = useForm<FormData>({
    resolver: zodResolver(identifierCorrectionSchemaFor(kind), undefined, {
      raw: true,
    }),
    defaultValues: {
      value: record.value ?? "",
      date: toDateTimeInput(record.date),
      notes: record.notes ?? "",
    },
  });

  const reloadAnimal = useReloadAnimals();
  const correct = useMutation({
    mutationFn: (payload: FormData) =>
      animalClient.correctIdentifier(animalId, kind, record.id, payload),
    onSuccess: reloadAnimal,
  });

  async function handleSubmit(data: FormData) {
    const dateChanged =
      !record.fromSession &&
      !!data.date &&
      data.date !== toDateTimeInput(record.date);

    try {
      await correct.mutateAsync({
        value: data.value,
        notes: data.notes,
        date: dateChanged ? data.date : undefined,
      });
      toast.success(`${label} corrigido com sucesso!`);
      onSaved();
    } catch (error) {
      applyServerErrors(form.setError, error);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        O valor lançado originalmente fica guardado no histórico. Deixe o{" "}
        {label.toLowerCase()} em branco se o registro era, na verdade, uma
        remoção.
      </p>

      <FieldRow cols={2}>
        <FormField
          name="value"
          control={form.control}
          label={label}
          render={({ field, id }) => (
            <Input
              {...field}
              id={id}
              autoFocus
              autoComplete="off"
              maxLength={IDENTIFIER_MAX_LENGTH[kind]}
            />
          )}
        />

        <FormField
          name="date"
          control={form.control}
          label="Data"
          render={({ field, id }) => (
            <Input
              {...field}
              id={id}
              type="datetime-local"
              max={nowInZone(timeZone)}
              disabled={record.fromSession}
              title={
                record.fromSession
                  ? "Identificação de sessão de manejo: a data segue a da sessão."
                  : undefined
              }
            />
          )}
        />
      </FieldRow>

      <FormField
        name="notes"
        control={form.control}
        label="Observação"
        render={({ field, id }) => (
          <Textarea
            {...field}
            id={id}
            placeholder="Motivo da correção..."
            className="resize-none"
            rows={3}
          />
        )}
      />

      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Voltar
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Salvar Correção
        </Button>
      </DialogFooter>
    </form>
  );
}
