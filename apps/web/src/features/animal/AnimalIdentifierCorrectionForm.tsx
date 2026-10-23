import { toInputDateTime } from "./format";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog";
import { FormField } from "@/components/our/FormField";
import FieldRow from "@/components/our/FieldRow";
import { nowDateTime } from "@ifarm/shared";
import { animalClient } from "@/lib/clients";
import {
  ApiError,
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
  const label = IDENTIFIER_LABELS[kind];
  const form = useForm<FormData>({
    resolver: zodResolver(identifierCorrectionSchemaFor(kind), undefined, {
      raw: true,
    }),
    defaultValues: {
      value: record.value ?? "",
      date: toInputDateTime(record.date),
      notes: record.notes ?? "",
    },
  });

  async function handleSubmit(data: FormData) {
    const dateChanged =
      !record.fromSession &&
      !!data.date &&
      data.date !== toInputDateTime(record.date);

    try {
      await animalClient.correctIdentifier(animalId, kind, record.id, {
        value: data.value,
        notes: data.notes,
        date: dateChanged ? data.date : undefined,
      });
      toast.success(`${label} corrigido com sucesso!`);
      onSaved();
    } catch (error) {
      if (error instanceof ApiError && error.errors) {
        Object.entries(error.errors).forEach(([field, message]) => {
          form.setError(field as keyof FormData, { type: "server", message });
        });
      } else if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("A requisição falhou! Tente novamente.");
      }
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
              max={nowDateTime()}
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
