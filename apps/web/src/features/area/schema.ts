import { z } from "zod";
import { FIELD_LIMITS } from "@/lib/field-limits";
import { numericField, optionalNumericField } from "@ifarm/shared";

export const hectaresSchema = z.coerce
  .number()
  .positive("Valor inválido.")
  .max(FIELD_LIMITS.area.area, "Limite ultrapassado.");

export const stockingRateSchema = z.coerce
  .number()
  .positive("Valor inválido.")
  .max(FIELD_LIMITS.area.stockingRate, "Limite ultrapassado");

// Dias de referência do pastejo rotacionado (ocupação e descanso da área).
export const daysSchema = z.coerce
  .number()
  .int("Informe um número inteiro de dias.")
  .positive("Valor inválido.")
  .max(FIELD_LIMITS.area.days, `Máximo de ${FIELD_LIMITS.area.days} dias.`);

export const areaFormSchema = z.object({
  name: z
    .string()
    .min(1, "Este campo é obrigatório")
    .max(
      FIELD_LIMITS.area.name,
      `Máximo de ${FIELD_LIMITS.area.name} caracteres`,
    ),
  polygon: z
    .any()
    .refine((val) => val != null, "Você deve desenhar o contorno no mapa."),
  hectares: numericField(hectaresSchema, "Este campo é obrigatório"),
  stockingRate: numericField(stockingRateSchema, "Este campo é obrigatório"),
  defaultOccupationDays: optionalNumericField(daysSchema),
  defaultRestDays: optionalNumericField(daysSchema),
  notes: z
    .string()
    .max(
      FIELD_LIMITS.area.notes,
      `Máximo de ${FIELD_LIMITS.area.notes} caracteres`,
    )
    .optional(),
  propertyId: z.uuid("Propriedade inválida."),
});

export type AreaFormData = z.infer<typeof areaFormSchema>;
