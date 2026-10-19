import { z } from "zod";
import { FIELD_LIMITS } from "@ifarm/shared";
import { dateOnlySchema } from "@/server/management-session/shared";
import { planStepSchema } from "@/server/management-session/steps";

export const managementSessionQuerySchema = z.object({
  propertyId: z.uuid().optional(),
  page: z.coerce.number().int().min(0).optional().default(0),
  pageSize: z.coerce.number().int().min(1).optional().default(10),
  search: z.string().trim().optional().default(""),
  // "open" = planejadas e em andamento.
  status: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z
      .enum(["open", "planned", "in_progress", "confirmed", "cancelled"])
      .optional(),
  ),
});

export type ManagementSessionQueryData = z.infer<
  typeof managementSessionQuerySchema
>;

export const managementSessionApiSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Este campo é obrigatório")
    .max(
      FIELD_LIMITS.managementSession.title,
      `Máximo de ${FIELD_LIMITS.managementSession.title} caracteres`,
    ),
  scheduledDate: dateOnlySchema,
  notes: z
    .string()
    .max(
      FIELD_LIMITS.managementSession.notes,
      `Máximo de ${FIELD_LIMITS.managementSession.notes} caracteres`,
    )
    .optional()
    .transform((v) => v || null),
  // Pode ficar vazio só numa recepção de compra (receber os animais já é o trabalho),
  // que é criada pela área de recepções; nas demais sessões a rota exige um manejo.
  steps: z.array(planStepSchema),
  animalIds: z.array(z.uuid()).default([]),
  propertyId: z.uuid().optional(),
});

export const managementSessionStartApiSchema = z.object({
  managementDate: dateOnlySchema,
});

export const participantsApiSchema = z.object({
  animalIds: z.array(z.uuid()).min(1, "Selecione ao menos um animal."),
});
