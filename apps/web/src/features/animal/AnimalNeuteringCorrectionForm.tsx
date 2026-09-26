"use client";

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
import { ApiError, AnimalNeuteringRecord, correctNeutering } from "./services";
import {
  neuteringCorrectionSchema,
  NeuteringCorrectionFormData,
} from "./schema";

interface AnimalNeuteringCorrectionFormProps {
  animalId: string;
  neutering: AnimalNeuteringRecord;
  // yyyy-mm-dd; a castração não pode ser anterior ao nascimento
  birthDate?: string | null;
  onCancel: () => void;
  onSaved: () => void;
}

// yyyy-mm-dd no fuso local, formato do input de data
const toInputDate = (iso: string) => new Date(iso).toLocaleDateString("en-CA");

export function AnimalNeuteringCorrectionForm({
  animalId,
  neutering,
  birthDate,
  onCancel,
  onSaved,
}: AnimalNeuteringCorrectionFormProps) {
  const form = useForm<NeuteringCorrectionFormData>({
    resolver: zodResolver(neuteringCorrectionSchema),
    defaultValues: {
      date: toInputDate(neutering.date),
      method: neutering.method ?? "",
      notes: neutering.notes ?? "",
    },
  });

  async function handleSubmit(data: NeuteringCorrectionFormData) {
    const dateChanged =
      !neutering.fromSession &&
      !!data.date &&
      data.date !== toInputDate(neutering.date);

    try {
      await correctNeutering(animalId, neutering.id, {
        method: data.method,
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
              type="date"
              min={birthDate ?? undefined}
              max={new Date().toLocaleDateString("en-CA")}
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
          name="method"
          control={form.control}
          label="Método"
          render={({ field, id }) => (
            <Input
              {...field}
              id={id}
              placeholder="Ex: Burdizzo, cirúrgica, elástico"
              autoFocus
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
