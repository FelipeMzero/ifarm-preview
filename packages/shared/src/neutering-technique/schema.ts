import { z } from "zod";
import { FIELD_LIMITS } from "../field-limits";

export const neuteringTechniqueSchema = z.object({
  name: z
    .string()
    .min(1, "Este campo não pode ser vazio")
    .max(
      FIELD_LIMITS.neuteringTechnique.name,
      `Máximo de ${FIELD_LIMITS.neuteringTechnique.name} caracteres`,
    ),
});

export type NeuteringTechniqueInput = z.infer<typeof neuteringTechniqueSchema>;
