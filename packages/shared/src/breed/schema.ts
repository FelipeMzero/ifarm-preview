import { z } from "zod";
import { FIELD_LIMITS } from "../field-limits";

export const breedSchema = z.object({
  name: z
    .string()
    .min(1, "Este campo não pode ser vazio")
    .max(
      FIELD_LIMITS.breed.name,
      `Máximo de ${FIELD_LIMITS.breed.name} caracteres`,
    ),
});

export type BreedInput = z.infer<typeof breedSchema>;
