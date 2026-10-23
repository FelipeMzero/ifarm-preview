import { z } from "zod";
import { FIELD_LIMITS } from "../field-limits";
import { numericField, optionalNumericField } from "../zod-utils";

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

// Dados de uma área como o usuário os informa: números como texto, "" para vazio.
export const areaSchema = z.object({
  name: z
    .string()
    .min(1, "Este campo é obrigatório")
    .max(
      FIELD_LIMITS.area.name,
      `Máximo de ${FIELD_LIMITS.area.name} caracteres`,
    ),
  /** Contorno desenhado no mapa (GeoJSON). */
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

export type AreaInput = z.infer<typeof areaSchema>;

// Filtros e paginação da listagem (parâmetros da URL: chegam como texto e são convertidos).
export const areaQuerySchema = z.object({
  propertyId: z.preprocess(
    (v) =>
      typeof v === "string" &&
      (v.trim() === "" || v === "undefined" || v === "null")
        ? undefined
        : v,
    z.uuid().optional(),
  ),
  status: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.enum(["active", "inactive"]).optional().default("active"),
  ),
  search: z.string().trim().optional().default(""),
  availableOnly: z.preprocess(
    (v) => v === "true" || v === true,
    z.boolean().optional(),
  ),
});

export type AreaQuery = z.output<typeof areaQuerySchema>;
/** Parâmetros que o cliente passa para listar (todos opcionais). */
export type AreaListParams = Partial<AreaQuery>;
