import { z } from "zod";
import { FIELD_LIMITS } from "../field-limits";
import { numberField, optionalNumberField } from "../zod-utils";

const hectaresSchema = z
  .number("Valor inválido.")
  .positive("Valor inválido.")
  .max(FIELD_LIMITS.area.area, "Limite ultrapassado.");

const stockingRateSchema = z
  .number("Valor inválido.")
  .positive("Valor inválido.")
  .max(FIELD_LIMITS.area.stockingRate, "Limite ultrapassado");

// Dias de referência do pastejo rotacionado (ocupação e descanso da área).
const daysSchema = z
  .number("Valor inválido.")
  .int("Informe um número inteiro de dias.")
  .positive("Valor inválido.")
  .max(FIELD_LIMITS.area.days, `Máximo de ${FIELD_LIMITS.area.days} dias.`);

// Dados de uma área: o formulário envia os números como texto e "" para vazio; o schema
// valida e converte (números, null para vazio).
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
  hectares: numberField(hectaresSchema, "Este campo é obrigatório"),
  stockingRate: numberField(stockingRateSchema, "Este campo é obrigatório"),
  defaultOccupationDays: optionalNumberField(daysSchema),
  defaultRestDays: optionalNumberField(daysSchema),
  notes: z
    .string()
    .max(
      FIELD_LIMITS.area.notes,
      `Máximo de ${FIELD_LIMITS.area.notes} caracteres`,
    )
    .optional()
    .transform((v) => v || null),
  propertyId: z.uuid("Propriedade inválida."),
});

/** O que o formulário envia (números como texto, "" para vazio). */
export type AreaPayload = z.input<typeof areaSchema>;
/** O que a API recebe depois da validação: números convertidos, vazios como null. */
export type AreaData = z.output<typeof areaSchema>;

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
