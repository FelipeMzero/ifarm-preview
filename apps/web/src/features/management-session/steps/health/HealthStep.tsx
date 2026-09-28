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
import { formatDay, handleStepError } from "../formHelpers";
import { describeDose, doseFor, type HealthConfig } from "./config";

type HealthRecord = { doseMl: number | null; notes: string | null };

// Com dose no procedimento, a dose aplicada é obrigatória.
function makeSchema(hasDose: boolean) {
  return z.object({
    doseMl: z
      .string()
      .optional()
      .refine((v) => !hasDose || !!v, "Informe a dose aplicada")
      .refine((v) => !v || Number(v) > 0, "A dose deve ser maior que zero"),
    notes: z.string().optional(),
  });
}
type FormData = z.infer<ReturnType<typeof makeSchema>>;

export default function HealthStep({
  formId,
  step,
  animal,
  record,
  records,
  readOnly,
  onSubmit,
}: StepScreenProps<HealthRecord>) {
  const config = (step.config ?? {}) as HealthConfig;
  const hasDose =
    config.doseType === "FIXED" || config.doseType === "PER_WEIGHT";

  // O peso pesado nesta sessão, se já houver, vale mais que o peso atual.
  const sessionWeight = (records.weighing as { weightKg?: number } | null)
    ?.weightKg;
  const weightKg = sessionWeight ?? animal.currentWeightKg;
  const suggestion = hasDose ? doseFor(config, weightKg) : null;

  const form = useForm<FormData>({
    resolver: zodResolver(makeSchema(hasDose)),
    defaultValues: {
      // Sem dose registrada: já vem com a dose calculada, para só conferir.
      doseMl:
        record?.doseMl != null
          ? String(record.doseMl)
          : suggestion != null
            ? String(suggestion)
            : "",
      notes: record?.notes ?? "",
    },
  });

  async function submit(data: FormData) {
    try {
      await onSubmit({
        doseMl: hasDose ? (data.doseMl ?? "") : null,
        notes: data.notes,
      });
    } catch (error) {
      handleStepError(form, error);
    }
  }

  const details = [
    config.veterinarianName && ["Veterinário", config.veterinarianName],
    config.withdrawalUntil && [
      "Carência até",
      formatDay(config.withdrawalUntil),
    ],
    config.nextDueDate && ["Próxima dose", formatDay(config.nextDueDate)],
    hasDose && ["Dose", describeDose(config)],
  ].filter(Boolean) as [string, string][];

  return (
    <form
      id={formId}
      onSubmit={form.handleSubmit(submit)}
      className="space-y-4"
    >
      {details.length > 0 && (
        <dl className="grid gap-x-6 gap-y-1 rounded-md border border-border bg-muted/40 p-3 text-sm sm:grid-cols-2">
          {details.map(([label, value]) => (
            <div key={label} className="flex gap-2">
              <dt className="text-muted-foreground">{label}:</dt>
              <dd className="font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      <p className="text-sm text-muted-foreground">
        {!hasDose
          ? "Confirme a aplicação no animal."
          : suggestion == null
            ? "Animal sem peso: informe a dose aplicada."
            : "Confirme a aplicação no animal e corrija a dose se foi diferente."}
      </p>

      <FieldSet className="border-0 p-0" disabled={readOnly}>
        {hasDose && (
          <FormField
            name="doseMl"
            control={form.control}
            label="Dose aplicada (ml)"
            required
            render={({ field, id }) => (
              <Input
                {...field}
                id={id}
                type="number"
                inputMode="decimal"
                step="any"
                min={0}
                placeholder={
                  suggestion != null ? String(suggestion) : undefined
                }
                className="max-w-60 tabular-nums"
              />
            )}
          />
        )}

        <FormField
          name="notes"
          control={form.control}
          label="Observação"
          render={({ field, id }) => (
            <Textarea
              {...field}
              id={id}
              maxLength={FIELD_LIMITS.managementSession.stepNotes}
              placeholder="Reação adversa, aplicação incompleta..."
              className="resize-none"
              rows={2}
            />
          )}
        />
      </FieldSet>
    </form>
  );
}
