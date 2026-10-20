"use client";

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
import { animalClient } from "@/lib/clients";
import { ApiError, type AnimalWeighing, nowDateTime } from "@ifarm/shared";
import { weighingCorrectionSchema, WeighingCorrectionFormData } from "./schema";

interface AnimalWeighingCorrectionFormProps {
  animalId: string;
  weighing: AnimalWeighing;
  // yyyy-mm-dd; a pesagem não pode ser anterior ao nascimento
  birthDate?: string | null;
  onCancel: () => void;
  onSaved: () => void;
}

// yyyy-mm-dd no fuso local, formato do input de data

export function AnimalWeighingCorrectionForm({
  animalId,
  weighing,
  birthDate,
  onCancel,
  onSaved,
}: AnimalWeighingCorrectionFormProps) {
  const form = useForm<WeighingCorrectionFormData>({
    resolver: zodResolver(weighingCorrectionSchema),
    defaultValues: {
      weightKg: String(weighing.weightKg),
      date: toInputDateTime(weighing.date),
      notes: weighing.notes ?? "",
    },
  });

  async function handleSubmit(data: WeighingCorrectionFormData) {
    const dateChanged =
      !weighing.fromSession &&
      !!data.date &&
      data.date !== toInputDateTime(weighing.date);

    try {
      await animalClient.correctWeighing(animalId, weighing.id, {
        weightKg: data.weightKg,
        notes: data.notes,
        date: dateChanged ? data.date : undefined,
      });
      toast.success("Pesagem corrigida com sucesso!");
      onSaved();
    } catch (error) {
      if (error instanceof ApiError && error.errors) {
        Object.entries(error.errors).forEach(([field, message]) => {
          form.setError(field as keyof WeighingCorrectionFormData, {
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
        O valor lançado originalmente fica guardado no histórico.
      </p>

      <FieldRow cols={2}>
        <FormField
          name="weightKg"
          control={form.control}
          label="Peso (kg)"
          required
          render={({ field, id }) => (
            <Input
              {...field}
              id={id}
              type="number"
              step="0.01"
              min="0"
              autoFocus
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
              min={birthDate ? `${birthDate}T00:00` : undefined}
              max={nowDateTime()}
              disabled={weighing.fromSession}
              title={
                weighing.fromSession
                  ? "Pesagem de sessão de manejo: a data segue a da sessão."
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
            placeholder="Observação sobre a pesagem..."
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
