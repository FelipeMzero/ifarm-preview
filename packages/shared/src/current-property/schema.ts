import { z } from "zod";

// Contrato da troca de propriedade atual (PUT /api/user/current-property).
export const currentPropertySchema = z.object({
  propertyId: z.string().min(1, "Este campo não pode ser vazio"),
});

export type CurrentPropertyPayload = z.input<typeof currentPropertySchema>;
