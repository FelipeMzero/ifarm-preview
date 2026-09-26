"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FieldSet } from "@/components/ui/field";
import { FormField } from "@/components/our/FormField";
import { FIELD_LIMITS } from "@/lib/field-limits";
import type { StepScreenProps } from "../types";
import { handleStepError } from "../formHelpers";

type IdentifierRecord = { value: string; notes: string | null };

type FormData = { value: string; notes?: string };

// Brinco e RFID têm a mesma tela; muda o campo do animal e o limite de tamanho.
function createIdentifierStep(config: {
  label: string;
  current: (animal: StepScreenProps["animal"]) => string | null;
  maxLength: number;
  placeholder: string;
}) {
  const schema = z.object({
    value: z
      .string()
      .trim()
      .min(1, "Este campo é obrigatório")
      .max(config.maxLength, `Máximo de ${config.maxLength} caracteres`),
    notes: z.string().optional(),
  });

  return function IdentifierStep({
    formId,
    animal,
    record,
    readOnly,
    onSubmit,
  }: StepScreenProps<IdentifierRecord>) {
    const form = useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: { value: record?.value ?? "", notes: record?.notes ?? "" },
    });

    async function submit(data: FormData) {
      try {
        await onSubmit(data);
      } catch (error) {
        handleStepError(form, error);
      }
    }

    const current = config.current(animal);

    return (
      <form
        id={formId}
        onSubmit={form.handleSubmit(submit)}
        className="space-y-4"
      >
        <p className="text-sm text-muted-foreground">
          {config.label} atual:{" "}
          <span className="font-medium text-foreground">
            {current ?? "nenhum"}
          </span>
        </p>

        <FieldSet className="border-0 p-0" disabled={readOnly}>
          <FormField
            name="value"
            control={form.control}
            label={`Novo ${config.label}`}
            required
            render={({ field, id }) => (
              <Input
                {...field}
                id={id}
                autoComplete="off"
                maxLength={config.maxLength}
                placeholder={config.placeholder}
                className="h-14 max-w-100 text-2xl md:text-2xl"
              />
            )}
          />

          <FormField
            name="notes"
            control={form.control}
            label="Observação"
            render={({ field, id }) => (
              <Textarea
                {...field}
                id={id}
                maxLength={FIELD_LIMITS.managementSession.stepNotes}
                placeholder="Motivo da troca, perda do anterior..."
                className="resize-none"
                rows={2}
              />
            )}
          />
        </FieldSet>
      </form>
    );
  };
}

export const TagStep = createIdentifierStep({
  label: "Brinco",
  current: (a) => a.earTag,
  maxLength: FIELD_LIMITS.animal.earTag,
  placeholder: "Número do brinco",
});

export const RfidStep = createIdentifierStep({
  label: "RFID",
  current: (a) => a.rfid,
  maxLength: FIELD_LIMITS.animal.rfid,
  placeholder: "Leia ou digite o RFID",
});
