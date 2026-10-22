import { z } from "zod";
import { managementSessionFieldsSchema } from "@ifarm/shared";
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

export const managementSessionApiSchema = managementSessionFieldsSchema.extend({
  // Pode ficar vazio só numa recepção de compra (receber os animais já é o trabalho),
  // que é criada pela área de recepções; nas demais sessões a rota exige um manejo.
  steps: z.array(planStepSchema),
  animalIds: z.array(z.uuid()).default([]),
  propertyId: z.uuid().optional(),
});
