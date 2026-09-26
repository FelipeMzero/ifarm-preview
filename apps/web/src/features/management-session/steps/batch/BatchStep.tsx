"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Check } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { FieldSet } from "@/components/ui/field";
import { FormField } from "@/components/our/FormField";
import { SelectField } from "@/components/our/SelectField";
import { FIELD_LIMITS } from "@/lib/field-limits";
import { cn } from "@/lib/utils";
import type { StepScreenProps } from "../types";
import { handleStepError } from "../formHelpers";

type BatchRecord = {
  keep: boolean;
  batch: { id: string; name: string } | null;
  notes: string | null;
};

type BatchConfig = { suggestedBatches?: { id: string; name: string }[] };

// "" = permanecer no lote atual.
const schema = z.object({ batchId: z.string(), notes: z.string().optional() });
type FormData = z.infer<typeof schema>;

function Choice({
  selected,
  disabled,
  onClick,
  children,
}: {
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      // Espaço escolhe a opção (padrão do botão); Enter envia o formulário, como num
      // campo de texto, com a opção já selecionada.
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.form?.requestSubmit();
        }
      }}
      aria-pressed={selected}
      className={cn(
        "flex min-h-14 items-center justify-between gap-2 rounded-lg border px-4 py-3 text-left text-sm transition-colors",
        selected
          ? "border-primary bg-primary/10 font-medium"
          : "border-border hover:bg-muted",
      )}
    >
      <span className="flex items-center gap-2">{children}</span>
      {selected && <Check className="size-4 shrink-0 text-primary" />}
    </button>
  );
}

export default function BatchStep({
  formId,
  step,
  animal,
  record,
  options,
  readOnly,
  onSubmit,
}: StepScreenProps<BatchRecord>) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      batchId: record?.batch?.id ?? "",
      notes: record?.notes ?? "",
    },
  });

  const batchId = useWatch({ control: form.control, name: "batchId" });
  const current = animal.currentBatch;
  const suggested = (
    (step.config as BatchConfig)?.suggestedBatches ?? []
  ).filter((b) => b.id !== current?.id);
  const suggestedIds = new Set(suggested.map((b) => b.id));
  const others = options.batches.filter(
    (b) => b.id !== current?.id && !suggestedIds.has(b.id),
  );
  const otherSelected = !!batchId && !suggestedIds.has(batchId);

  function choose(value: string) {
    form.setValue("batchId", value, { shouldDirty: true });
  }

  async function submit(data: FormData) {
    try {
      await onSubmit({ batchId: data.batchId || null, notes: data.notes });
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
        Para onde o animal vai ao sair do manejo? A troca de lote só acontece na
        consolidação.
      </p>

      <FieldSet className="border-0 p-0" disabled={readOnly}>
        <div className="grid gap-2 sm:grid-cols-2">
          <Choice
            selected={!batchId}
            disabled={readOnly}
            onClick={() => choose("")}
          >
            Permanecer {current ? `em ${current.name}` : "sem lote"}
          </Choice>
          {suggested.map((b) => (
            <Choice
              key={b.id}
              selected={batchId === b.id}
              disabled={readOnly}
              onClick={() => choose(b.id)}
            >
              <ArrowRight className="size-4 text-muted-foreground" />
              {b.name}
            </Choice>
          ))}
        </div>

        <FormField
          name="batchId"
          control={form.control}
          label="Outro lote"
          render={({ field, id }) => (
            <SelectField
              id={id}
              value={otherSelected ? field.value : ""}
              onValueChange={(v) => field.onChange(v)}
              items={others.map((b) => ({ value: b.id, label: b.name }))}
              placeholder="Escolher outro lote..."
              searchable
              searchPlaceholder="Buscar lote..."
              className="w-full max-w-100"
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
              placeholder="Motivo da apartação..."
              className="resize-none"
              rows={2}
            />
          )}
        />
      </FieldSet>
    </form>
  );
}
