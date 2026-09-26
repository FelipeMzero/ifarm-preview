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
import { formatBRL, formatDay, handleStepError } from "../formHelpers";
import { PRICING_LABELS, type HealthConfig } from "./config";

type HealthRecord = { cost: number | null; notes: string | null };

const schema = z.object({
  cost: z
    .string()
    .optional()
    .refine((v) => !v || Number(v) >= 0, "O custo não pode ser negativo"),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

function suggestedCost(config: HealthConfig, weightKg: number | null) {
  if (config.pricingType === "FREE") return 0;
  if (config.unitPrice == null) return null;
  if (config.pricingType === "FIXED") return config.unitPrice;
  if (config.pricingType === "PER_WEIGHT" && weightKg != null) {
    return Math.round(config.unitPrice * weightKg * 100) / 100;
  }
  return null;
}

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
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      cost: record?.cost != null ? String(record.cost) : "",
      notes: record?.notes ?? "",
    },
  });

  // O peso pesado nesta sessão, se já houver, vale mais que o peso atual.
  const sessionWeight = (records.weighing as { weightKg?: number } | null)
    ?.weightKg;
  const suggestion = suggestedCost(
    config,
    sessionWeight ?? animal.currentWeightKg,
  );

  async function submit(data: FormData) {
    try {
      await onSubmit({ cost: data.cost ?? "", notes: data.notes });
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
    config.pricingType && [
      "Cobrança",
      config.pricingType === "FREE" || config.unitPrice == null
        ? PRICING_LABELS[config.pricingType]
        : `${PRICING_LABELS[config.pricingType]}: ${formatBRL(config.unitPrice)}${
            config.pricingType === "PER_WEIGHT" ? "/kg" : ""
          }`,
    ],
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
        Confirme a aplicação no animal. O custo é opcional: em branco, ele é
        calculado pela forma de cobrança na consolidação
        {suggestion != null && ` (estimativa: ${formatBRL(suggestion)})`}.
      </p>

      <FieldSet className="border-0 p-0" disabled={readOnly}>
        <FormField
          name="cost"
          control={form.control}
          label="Custo individual (R$)"
          render={({ field, id }) => (
            <Input
              {...field}
              id={id}
              type="number"
              inputMode="decimal"
              step="0.01"
              min={0}
              placeholder={
                suggestion != null ? suggestion.toFixed(2) : undefined
              }
              className="max-w-60 tabular-nums"
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
              placeholder="Reação adversa, dose diferente..."
              className="resize-none"
              rows={2}
            />
          )}
        />
      </FieldSet>
    </form>
  );
}
