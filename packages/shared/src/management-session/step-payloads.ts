import { z } from "zod";
import type { IdentifierKind } from "../animal/client";
import { IDENTIFIER_MAX_LENGTH } from "../animal/schema";
import { FIELD_LIMITS } from "../field-limits";

// Registro de cada etapa num animal da sessão: o que a tela de registro envia. Os módulos
// de etapa do servidor (apps/api/src/features/management-session/steps) validam com estes
// schemas e as telas também (zodResolver em modo raw). As regras que dependem do banco (ex.:
// "este já é o brinco atual", dose obrigatória conforme o procedimento) ficam no `save` de
// cada módulo.

/** Observação por animal, comum a todas as etapas. */
export const stepNotesSchema = z
  .string()
  .trim()
  .max(
    FIELD_LIMITS.managementSession.stepNotes,
    `Máximo de ${FIELD_LIMITS.managementSession.stepNotes} caracteres`,
  )
  .nullish()
  .transform((v) => v || null);

export const weighingPayloadSchema = z.object({
  weightKg: z
    .union([z.string(), z.number()])
    .refine((v) => v !== "", "Informe o peso")
    .transform(Number)
    .pipe(
      z
        .number("Informe um peso válido")
        .positive("O peso deve ser maior que zero")
        .max(3000, "Peso acima do limite (3000 kg)"),
    ),
  notes: stepNotesSchema,
});

export const identifierPayloadSchemaFor = (kind: IdentifierKind) =>
  z.object({
    value: z
      .string()
      .trim()
      .min(1, "Este campo é obrigatório")
      .max(
        IDENTIFIER_MAX_LENGTH[kind],
        `Máximo de ${IDENTIFIER_MAX_LENGTH[kind]} caracteres`,
      ),
    notes: stepNotesSchema,
  });

export const REQUIRED_TECHNIQUE_MESSAGE = "Informe a técnica.";

export const neuteringPayloadSchema = z.object({
  // Castração feita na fazenda: a técnica é sempre conhecida.
  techniqueId: z
    .string(REQUIRED_TECHNIQUE_MESSAGE)
    .min(1, REQUIRED_TECHNIQUE_MESSAGE),
  notes: stepNotesSchema,
});

export const REQUIRED_DOSE_MESSAGE = "Informe a dose aplicada.";

/** Dose aplicada (ml): vazia = não informada; informada, maior que zero. */
const doseMl = z
  .union([z.string(), z.number(), z.null()])
  .optional()
  .transform((v) => (v === "" || v == null ? null : Number(v)))
  .pipe(
    z
      .number("Informe uma dose válida")
      .positive("A dose deve ser maior que zero")
      .nullable(),
  );

export const healthPayloadSchema = z.object({ doseMl, notes: stepNotesSchema });

// Na tela, que já sabe se o procedimento tem dose: com dose, a dose aplicada é
// obrigatória (quem aplicou sabe a dose). O servidor confere o mesmo no `save`.
export const healthPayloadSchemaFor = (requiresDose: boolean) =>
  healthPayloadSchema.superRefine((data, ctx) => {
    if (requiresDose && data.doseMl == null) {
      ctx.addIssue({
        code: "custom",
        path: ["doseMl"],
        message: REQUIRED_DOSE_MESSAGE,
      });
    }
  });

export const batchPayloadSchema = z.object({
  // Vazio ou null = permanecer no lote atual.
  batchId: z
    .union([z.uuid(), z.literal(""), z.null()])
    .transform((v) => v || null),
  notes: stepNotesSchema,
});

export type WeighingPayload = z.input<typeof weighingPayloadSchema>;
export type IdentifierPayload = z.input<
  ReturnType<typeof identifierPayloadSchemaFor>
>;
export type NeuteringPayload = z.input<typeof neuteringPayloadSchema>;
export type HealthPayload = z.input<typeof healthPayloadSchema>;
export type BatchPayload = z.input<typeof batchPayloadSchema>;
