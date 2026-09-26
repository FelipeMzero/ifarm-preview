"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TriangleAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FieldSet } from "@/components/ui/field";
import { FormField } from "@/components/our/FormField";
import { FIELD_LIMITS } from "@/lib/field-limits";
import type { StepScreenProps } from "../types";
import { formatDay, handleStepError } from "../formHelpers";

type NeuteringRecord = { method: string | null; notes: string | null };

const METHODS = ["Burdizzo", "Cirúrgica", "Elástico"];

const schema = z.object({
  method: z.string().max(50, "Máximo de 50 caracteres").optional(),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function NeuteringStep({
  formId,
  animal,
  record,
  readOnly,
  onSubmit,
}: StepScreenProps<NeuteringRecord>) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { method: record?.method ?? "", notes: record?.notes ?? "" },
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
          name="method"
          control={form.control}
          label="Método"
          render={({ field, id }) => (
            <Input
              {...field}
              id={id}
              list="neutering-methods"
              placeholder="Ex: Burdizzo"
              className="max-w-80"
            />
          )}
        />
        <datalist id="neutering-methods">
          {METHODS.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>

        <FormField
          name="notes"
          control={form.control}
          label="Observação"
          render={({ field, id }) => (
            <Textarea
              {...field}
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
