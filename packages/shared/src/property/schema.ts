import { z } from "zod";
import { addressFields, checkAddress } from "../address/schema";
import { FIELD_LIMITS } from "../field-limits";
import { numberField, optionalNumberField } from "../zod-utils";
import { BR_TIME_ZONES } from "./time-zones";

const latitudeSchema = z
  .number("Valor inválido.")
  .min(-90, "Latitude deve estar entre -90 e 90.")
  .max(90, "Latitude deve estar entre -90 e 90.");

const longitudeSchema = z
  .number("Valor inválido.")
  .min(-180, "Longitude deve estar entre -180 e 180.")
  .max(180, "Longitude deve estar entre -180 e 180.");

const propertyAreaSchema = z
  .number("Valor inválido.")
  .positive("Valor inválido.")
  .max(FIELD_LIMITS.property.area, "Limite ultrapassado");

// Dados de uma propriedade: o formulário envia os números como texto e "" para vazio; o schema
// valida e converte (números, null para vazio).
export const propertySchema = z
  .object({
    name: z
      .string()
      .min(1, "Este campo não pode ser vazio")
      .max(
        FIELD_LIMITS.property.name,
        `Máximo de ${FIELD_LIMITS.property.name} caracteres`,
      ),
    // RN-PROPRIEDADE-02: toda propriedade tem um titular.
    ownerId: z.string().min(1, "Este campo não pode ser vazio"),
    /** Só para exibição no formulário; a API ignora. */
    ownerName: z.string().optional(),

    totalArea: optionalNumberField(propertyAreaSchema),
    productiveArea: optionalNumberField(propertyAreaSchema),

    cib: z
      .string()
      .max(
        FIELD_LIMITS.property.cib,
        `Máximo de ${FIELD_LIMITS.property.cib} caracteres`,
      )
      .optional()
      .transform((v) => v || null),
    ccir: z
      .string()
      .optional()
      .transform((v) => v || null),
    car: z
      .string()
      .optional()
      .transform((v) => v || null),
    // RN-PROPRIEDADE-04: toda propriedade tem localização.
    latitude: numberField(latitudeSchema, "Este campo é obrigatório"),
    longitude: numberField(longitudeSchema, "Este campo é obrigatório"),
    // RN-PROPRIEDADE-05: o fuso do local da propriedade (sugerido pela localização na tela).
    timeZone: z.enum(BR_TIME_ZONES, "Selecione o fuso horário"),

    ...addressFields,
  })
  .check((ctx) => {
    const { totalArea, productiveArea } = ctx.value;

    // RN-PROPRIEDADE-03: a área produtiva não pode ser maior que a área total.
    if (
      productiveArea != null &&
      totalArea != null &&
      productiveArea > totalArea
    ) {
      ctx.issues.push({
        code: "custom",
        input: productiveArea,
        path: ["productiveArea"],
        message: "A área produtiva não pode ser maior que a área total.",
      });
    }

    checkAddress(ctx.value, ctx.issues);
  });

/** O que o formulário envia (números como texto, "" para vazio). */
export type PropertyPayload = z.input<typeof propertySchema>;
/** O que a API recebe depois da validação: números convertidos, vazios como null. */
export type PropertyData = z.output<typeof propertySchema>;

// Filtros e paginação da listagem (parâmetros da URL: chegam como texto e são convertidos).
export const propertyQuerySchema = z.object({
  page: z.coerce.number().int().min(0).optional().default(0),
  pageSize: z.coerce.number().int().min(1).optional().default(10),
  search: z.string().trim().optional().default(""),
  status: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.enum(["active", "inactive"]).optional(),
  ),
});

export type PropertyQuery = z.output<typeof propertyQuerySchema>;
/** Parâmetros que o cliente passa para listar (todos opcionais). */
export type PropertyListParams = Partial<PropertyQuery>;
