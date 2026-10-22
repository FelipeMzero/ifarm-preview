"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FieldSet } from "@/components/ui/field";
import { FormField } from "@/components/our/FormField";
import {
  FIELD_LIMITS,
  IDENTIFIER_MAX_LENGTH,
  identifierPayloadSchemaFor,
  type IdentifierKind,
  type IdentifierPayload,
} from "@ifarm/shared";
import type { StepScreenProps } from "../types";
import { handleStepError } from "../formHelpers";

type IdentifierRecord = { value: string; notes: string | null };

type FormData = IdentifierPayload;

// Brinco e RFID têm a mesma tela; muda o campo do animal e o limite de tamanho (do
// schema do tipo, em @ifarm/shared).
function createIdentifierStep(config: {
  label: string;
  current: (animal: StepScreenProps["animal"]) => string | null;
  kind: IdentifierKind;
  placeholder: string;
}) {
  const schema = identifierPayloadSchemaFor(config.kind);
  const maxLength = IDENTIFIER_MAX_LENGTH[config.kind];

  return function IdentifierStep({
    formId,
    animal,
    record,
    readOnly,
    onSubmit,
  }: StepScreenProps<IdentifierRecord>) {
    const form = useForm<FormData>({
      resolver: zodResolver(schema, undefined, { raw: true }),
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
                maxLength={maxLength}
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
                value={field.value ?? ""}
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
  kind: "tag",
  placeholder: "Número do brinco",
});

export const RfidStep = createIdentifierStep({
  label: "RFID",
  current: (a) => a.rfid,
  kind: "rfid",
  placeholder: "Leia ou digite o RFID",
});
