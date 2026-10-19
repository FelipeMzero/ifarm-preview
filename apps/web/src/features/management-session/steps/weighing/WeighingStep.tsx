"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FieldSet } from "@/components/ui/field";
import { FormField } from "@/components/our/FormField";
import { FIELD_LIMITS } from "@ifarm/shared";
import type { StepScreenProps } from "../types";
import { formatDay, formatKg, handleStepError } from "../formHelpers";

type WeighingRecord = { weightKg: number; notes: string | null };

const schema = z.object({
  weightKg: z
    .string()
    .min(1, "Informe o peso")
    .refine((v) => Number(v) > 0, "O peso deve ser maior que zero"),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

// Variação acima disso em relação à última pesagem provavelmente é erro de digitação.
const SUSPICIOUS_VARIATION = 0.3;

export default function WeighingStep({
  formId,
  animal,
  record,
  readOnly,
  onSubmit,
}: StepScreenProps<WeighingRecord>) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      weightKg: record ? String(record.weightKg) : "",
      notes: record?.notes ?? "",
    },
  });

  const weight = Number(useWatch({ control: form.control, name: "weightKg" }));
  const previous = animal.currentWeightKg;
  const diff = previous != null && weight > 0 ? weight - previous : null;
  const suspicious =
    diff != null &&
    previous! > 0 &&
    Math.abs(diff) / previous! > SUSPICIOUS_VARIATION;

  async function submit(data: FormData) {
    try {
      await onSubmit({ weightKg: Number(data.weightKg), notes: data.notes });
    } catch (error) {
      handleStepError(form, error);
    }
  }

  return (
    <form
      id={formId}
      onSubmit={form.handleSubmit(submit)}
      className="space-y-4"
    >
      <p className="text-sm text-muted-foreground">
        {previous != null ? (
          <>
            Última pesagem:{" "}
            <span className="font-medium text-foreground">
              {formatKg(previous)}
            </span>
            {animal.lastWeighedAt && ` em ${formatDay(animal.lastWeighedAt)}`}
          </>
        ) : (
          "Animal sem pesagem anterior."
        )}
      </p>

      <FieldSet className="border-0 p-0" disabled={readOnly}>
        <FormField
          name="weightKg"
          control={form.control}
          label="Peso (kg)"
          required
          warning={
            suspicious
              ? `Variação de ${formatKg(diff!)} em relação à última pesagem. Confira o valor.`
              : null
          }
          render={({ field, id }) => (
            <Input
              {...field}
              id={id}
              type="number"
              inputMode="decimal"
              step="any"
              min={0}
              className="h-14 max-w-60 text-2xl tabular-nums md:text-2xl"
            />
          )}
        />
        {diff != null && !suspicious && (
          <p className="-mt-2 text-sm text-muted-foreground tabular-nums">
            {diff >= 0 ? "+" : "−"}
            {formatKg(Math.abs(diff))} desde a última pesagem
          </p>
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
              className="resize-none"
              rows={2}
            />
          )}
        />
      </FieldSet>
    </form>
  );
}
