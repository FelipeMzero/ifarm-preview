import { z } from "zod";

export const areaFormSchema = z.object({
  name: z.string().min(1, "Este campo é obrigatório"),
  polygon: z.any().refine(val => val != null, "Você deve desenhar o contorno no mapa."),
  hectares: z.string().min(1, "Este campo é obrigatório")
    .refine(v => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, "Hectares não pode ser negativo."),
  stockingRate: z.string().min(1, "Este campo é obrigatório")
    .refine(v => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, "Taxa de lotação não pode ser negativa."),
  notes: z.string().optional(),
  propertyId: z.string().uuid("Propriedade inválida."),
});

export type AreaFormData = z.infer<typeof areaFormSchema>;
