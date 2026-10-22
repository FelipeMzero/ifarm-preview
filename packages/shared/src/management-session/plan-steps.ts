import { z } from "zod";
import { HealthManagementDoseType } from "../enums";
import { FIELD_LIMITS } from "../field-limits";

// Etapas do planejamento de uma sessão: o que a API recebe em `steps` ao criar/alterar uma
// sessão ou abrir uma recepção. Cada tipo tem o seu schema; os módulos de etapa do servidor
// (server/management-session/steps) usam estes mesmos schemas e fazem o que depende do
// banco no `prepare` (ex.: gravar as datas do sanitário). O formulário de planejamento tem
// estado próprio (um objeto com os campos de todos os tipos) e converte para este formato
// no envio.

/** Número opcional, como texto (formulário) ou número; vazio/nulo = não informado. */
const optionalPositive = z
  .union([z.string(), z.number(), z.null()])
  .optional()
  .transform((v) => (v === "" || v == null ? null : Number(v)))
  .pipe(
    z
      .number("Informe um valor válido")
      .positive("Informe um valor maior que zero")
      .nullable(),
  );

/** Data opcional "AAAA-MM-DD"; vazia = não informada. */
const optionalDay = z
  .union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida."),
    z.literal(""),
    z.null(),
  ])
  .optional()
  .transform((v) => v || null);

export const weighingPlanSchema = z.object({ type: z.literal("weighing") });
export const tagPlanSchema = z.object({ type: z.literal("tag") });
export const rfidPlanSchema = z.object({ type: z.literal("rfid") });

export const neuteringPlanSchema = z.object({
  type: z.literal("neutering"),
  // Técnica prevista: vem pré-selecionada no registro, que pode escolher outra.
  suggestedTechniqueId: z.uuid().nullish().default(null),
});

export const batchPlanSchema = z.object({
  type: z.literal("batch"),
  suggestedBatchIds: z.array(z.uuid()).default([]),
});

export const healthPlanSchema = z
  .object({
    type: z.literal("health"),
    healthManagementId: z.uuid().optional(),
    typeId: z.uuid("Selecione o tipo do procedimento."),
    title: z
      .string()
      .trim()
      .max(
        FIELD_LIMITS.managementSession.healthTitle,
        `Máximo de ${FIELD_LIMITS.managementSession.healthTitle} caracteres`,
      )
      .nullish()
      .transform((v) => v || null),
    veterinarianId: z
      .uuid()
      .nullish()
      .or(z.literal(""))
      .transform((v) => v || null),
    doseType: z.enum(HealthManagementDoseType).default("NONE"),
    doseMl: optionalPositive,
    doseWeightKg: optionalPositive,
    withdrawalEndDate: optionalDay,
    nextDueDate: optionalDay,
  })
  .refine((v) => v.doseType === "NONE" || v.doseMl != null, {
    message: "Informe a dose.",
    path: ["doseMl"],
  })
  .refine((v) => v.doseType !== "PER_WEIGHT" || v.doseWeightKg != null, {
    message: "Informe o peso de referência.",
    path: ["doseWeightKg"],
  });

/** Uma etapa do planejamento: o `type` escolhe o schema. */
export const planStepSchema = z.discriminatedUnion("type", [
  weighingPlanSchema,
  neuteringPlanSchema,
  tagPlanSchema,
  rfidPlanSchema,
  healthPlanSchema,
  batchPlanSchema,
]);

export type PlanStepPayload = z.input<typeof planStepSchema>;
export type PlanStepData = z.output<typeof planStepSchema>;
