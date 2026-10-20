import { z } from "zod";
import { FIELD_LIMITS } from "@ifarm/shared";
import { STEP_TYPES } from "@ifarm/shared";

// Uma etapa no formulário de planejamento. Os campos extras só valem para o tipo
// correspondente (castração, sanitário e apartação); os demais tipos não têm configuração.
export const planStepFormSchema = z
  .object({
    type: z.enum(STEP_TYPES),
    healthManagementId: z.string().optional(),
    typeId: z.string().optional(),
    title: z
      .string()
      .max(
        FIELD_LIMITS.managementSession.healthTitle,
        `Máximo de ${FIELD_LIMITS.managementSession.healthTitle} caracteres`,
      )
      .optional(),
    veterinarianId: z.string().optional(),
    doseType: z.string().optional(),
    doseMl: z.string().optional(),
    doseWeightKg: z.string().optional(),
    withdrawalEndDate: z.string().optional(),
    nextDueDate: z.string().optional(),
    suggestedBatchIds: z.array(z.string()).optional(),
    suggestedTechniqueId: z.string().optional(),
    // Só para exibir a técnica prevista se ela tiver sido inativada depois.
    suggestedTechniqueName: z.string().optional(),
  })
  .superRefine((step, ctx) => {
    if (step.type !== "health") return;
    if (!step.typeId) {
      ctx.addIssue({
        code: "custom",
        message: "Selecione o tipo do procedimento",
        path: ["typeId"],
      });
    }
    if (
      (step.doseType === "FIXED" || step.doseType === "PER_WEIGHT") &&
      !(Number(step.doseMl) > 0)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Informe a dose",
        path: ["doseMl"],
      });
    }
    if (step.doseType === "PER_WEIGHT" && !(Number(step.doseWeightKg) > 0)) {
      ctx.addIssue({
        code: "custom",
        message: "Informe o peso",
        path: ["doseWeightKg"],
      });
    }
  });

export type PlanStepForm = z.infer<typeof planStepFormSchema>;

// Campos vazios viram null; o servidor valida cada etapa pelo schema do seu tipo.
export function toStepPayload(step: PlanStepForm) {
  if (step.type === "health") {
    return {
      type: step.type,
      healthManagementId: step.healthManagementId || undefined,
      typeId: step.typeId,
      title: step.title || null,
      veterinarianId: step.veterinarianId || null,
      doseType: step.doseType || "NONE",
      doseMl: step.doseMl ? Number(step.doseMl) : null,
      doseWeightKg: step.doseWeightKg ? Number(step.doseWeightKg) : null,
      withdrawalEndDate: step.withdrawalEndDate || null,
      nextDueDate: step.nextDueDate || null,
    };
  }
  if (step.type === "batch") {
    return { type: step.type, suggestedBatchIds: step.suggestedBatchIds ?? [] };
  }
  if (step.type === "neutering") {
    return {
      type: step.type,
      suggestedTechniqueId: step.suggestedTechniqueId || null,
    };
  }
  return { type: step.type };
}

export const planFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Este campo é obrigatório")
    .max(
      FIELD_LIMITS.managementSession.title,
      `Máximo de ${FIELD_LIMITS.managementSession.title} caracteres`,
    ),
  scheduledAt: z.string().min(1, "Este campo é obrigatório"),
  notes: z
    .string()
    .max(
      FIELD_LIMITS.managementSession.notes,
      `Máximo de ${FIELD_LIMITS.managementSession.notes} caracteres`,
    )
    .optional(),
  steps: z.array(planStepFormSchema).min(1, "Adicione ao menos um manejo."),
});

export type PlanFormData = z.infer<typeof planFormSchema>;
