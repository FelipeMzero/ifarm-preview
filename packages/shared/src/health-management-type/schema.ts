import { z } from "zod";
import { FIELD_LIMITS } from "../field-limits";

export const healthManagementTypeSchema = z.object({
  name: z
    .string()
    .min(1, "Este campo não pode ser vazio")
    .max(
      FIELD_LIMITS.healthManagementType.name,
      `Máximo de ${FIELD_LIMITS.healthManagementType.name} caracteres`,
    ),
});

export type HealthManagementTypeInput = z.infer<
  typeof healthManagementTypeSchema
>;
