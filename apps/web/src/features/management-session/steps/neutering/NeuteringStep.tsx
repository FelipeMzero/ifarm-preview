import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TriangleAlert } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { FieldSet } from "@/components/ui/field";
import { FormField } from "@/components/our/FormField";
import { SelectField } from "@/components/our/SelectField";
import { techniqueItems } from "@/features/neutering-technique/items";
import {
  FIELD_LIMITS,
  neuteringPayloadSchema,
  type NeuteringPayload,
} from "@ifarm/shared";
import type { StepScreenProps } from "../types";
import { formatDay, handleStepError } from "../formHelpers";

type NeuteringRecord = {
  techniqueId: string | null;
  techniqueName: string | null;
  notes: string | null;
};

// Configuração da etapa definida no planejamento (StepView.config).
export type NeuteringConfig = {
  suggestedTechnique?: { id: string; name: string; active: boolean } | null;
};

type FormData = NeuteringPayload;

export function NeuteringStep({
  formId,
  step,
  animal,
  record,
  readOnly,
  options,
  onSubmit,
}: StepScreenProps<NeuteringRecord>) {
  // Sem registro, vem a técnica prevista no planejamento, se ainda estiver ativa.
  const planned = (step.config as NeuteringConfig | undefined)
    ?.suggestedTechnique;
  const suggested = planned?.active ? planned : null;

  const form = useForm<FormData>({
    resolver: zodResolver(neuteringPayloadSchema, undefined, { raw: true }),
    defaultValues: {
      techniqueId: record?.techniqueId ?? suggested?.id ?? "",
      notes: record?.notes ?? "",
    },
  });

  async function submit(data: FormData) {
    try {
      await onSubmit(data);
    } catch (error) {
      handleStepError(form, error);
    }
  }

  const warnings = [
    animal.neutered &&
      (animal.lastNeuteredAt
        ? `Este animal já tem castração registrada em ${formatDay(animal.lastNeuteredAt)}. Registre apenas se o procedimento precisou ser refeito.`
        : "Este animal já consta como castrado. Registre apenas se o procedimento precisou ser refeito."),
    animal.sex === "FEMALE" && "Este animal é uma fêmea.",
  ].filter(Boolean) as string[];

  return (
    <form
      id={formId}
      onSubmit={form.handleSubmit(submit)}
      className="space-y-4"
    >
      {warnings.map((text) => (
        <div
          key={text}
          role="alert"
          className="flex gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" />
          {text}
        </div>
      ))}

      <FieldSet className="border-0 p-0" disabled={readOnly}>
        <FormField
          name="techniqueId"
          control={form.control}
          label="Técnica"
          required
          render={({ field, id }) => (
            <SelectField
              id={id}
              value={field.value ?? ""}
              onValueChange={field.onChange}
              items={techniqueItems(options.neuteringTechniques, {
                // Mostra o nome já gravado (ou o previsto) antes de as opções chegarem.
                current: record
                  ? { id: record.techniqueId, name: record.techniqueName }
                  : suggested,
              })}
              placeholder="Selecione..."
              className="w-full max-w-80"
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
              value={field.value ?? ""}
              id={id}
              maxLength={FIELD_LIMITS.managementSession.stepNotes}
              placeholder="Complicações, sangramento..."
              className="resize-none"
              rows={2}
            />
          )}
        />
      </FieldSet>
    </form>
  );
}
