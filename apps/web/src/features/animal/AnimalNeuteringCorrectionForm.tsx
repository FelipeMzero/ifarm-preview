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
import { SelectField } from "@/components/our/SelectField";
import { type NeuteringTechnique, nowDateTime } from "@ifarm/shared";
import { techniqueItems } from "@/features/neutering-technique/items";
import { animalClient } from "@/lib/clients";
import { ApiError, type AnimalNeuteringRecord } from "@ifarm/shared";
import {
  neuteringCorrectionSchema,
  type NeuteringCorrectionPayload as NeuteringCorrectionFormData,
} from "@ifarm/shared";

interface AnimalNeuteringCorrectionFormProps {
  animalId: string;
  neutering: AnimalNeuteringRecord;
  techniques: NeuteringTechnique[];
  // yyyy-mm-dd; a castração não pode ser anterior ao nascimento
  birthDate?: string | null;
  onCancel: () => void;
  onSaved: () => void;
}

// yyyy-mm-dd no fuso local, formato do input de data

export function AnimalNeuteringCorrectionForm({
  animalId,
  neutering,
  techniques,
  birthDate,
  onCancel,
  onSaved,
}: AnimalNeuteringCorrectionFormProps) {
  const form = useForm<NeuteringCorrectionFormData>({
    resolver: zodResolver(neuteringCorrectionSchema, undefined, { raw: true }),
    defaultValues: {
      date: toInputDateTime(neutering.date),
      techniqueId: neutering.techniqueId ?? "",
      notes: neutering.notes ?? "",
    },
  });

  async function handleSubmit(data: NeuteringCorrectionFormData) {
    const dateChanged =
      !neutering.fromSession &&
      !!data.date &&
      data.date !== toInputDateTime(neutering.date);

    try {
      await animalClient.correctNeutering(animalId, neutering.id, {
        techniqueId: data.techniqueId,
        notes: data.notes,
        date: dateChanged ? data.date : undefined,
      });
      toast.success("Castração corrigida com sucesso!");
      onSaved();
    } catch (error) {
      if (error instanceof ApiError && error.errors) {
        Object.entries(error.errors).forEach(([field, message]) => {
          form.setError(field as keyof NeuteringCorrectionFormData, {
            type: "server",
            message,
          });
        });
      } else {
        toast.error("A requisição falhou! Tente novamente.");
      }
    }
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Os valores lançados originalmente ficam guardados no histórico.
      </p>

      <FieldRow cols={2}>
        <FormField
          name="date"
          control={form.control}
          label="Data"
          render={({ field, id }) => (
            <Input
              {...field}
              id={id}
              type="datetime-local"
              min={birthDate ? `${birthDate}T00:00` : undefined}
              max={nowDateTime()}
              disabled={neutering.fromSession}
              title={
                neutering.fromSession
                  ? "Castração de sessão de manejo: a data segue a da sessão."
                  : undefined
              }
            />
          )}
        />

        <FormField
          name="techniqueId"
          control={form.control}
          label="Técnica"
          required={!!neutering.techniqueId}
          render={({ field, id }) => (
            <SelectField
              id={id}
              value={field.value ?? ""}
              onValueChange={field.onChange}
              items={techniqueItems(techniques, {
                current: {
                  id: neutering.techniqueId,
                  name: neutering.techniqueName,
                },
                // Lançada sem técnica (ex.: chegou castrado): pode continuar assim.
                optional: !neutering.techniqueId,
              })}
              placeholder="Selecione..."
              className="w-full"
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
            placeholder="Observação sobre a castração..."
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
