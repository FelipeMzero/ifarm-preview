import { z } from "zod";
import { addressFields, checkAddress } from "../address/schema";
import { FIELD_LIMITS } from "../field-limits";
import { numericField, optionalNumericField } from "../zod-utils";
import { BR_TIME_ZONES } from "./time-zones";

const latitudeSchema = z.coerce
  .number()
  .min(-90, "Latitude deve estar entre -90 e 90.")
  .max(90, "Latitude deve estar entre -90 e 90.");

const longitudeSchema = z.coerce
  .number()
  .min(-180, "Longitude deve estar entre -180 e 180.")
  .max(180, "Longitude deve estar entre -180 e 180.");

const propertyAreaSchema = z.coerce
  .number()
  .positive("Valor inválido.")
  .max(FIELD_LIMITS.property.area, "Limite ultrapassado");

// Dados de uma propriedade como o usuário os informa: números como texto, "" para vazio.
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

    totalArea: optionalNumericField(propertyAreaSchema),
    productiveArea: optionalNumericField(propertyAreaSchema),

    cib: z
      .string()
      .max(
        FIELD_LIMITS.property.cib,
        `Máximo de ${FIELD_LIMITS.property.cib} caracteres`,
      )
      .optional(),
    ccir: z.string().optional(),
    car: z.string().optional(),
    // RN-PROPRIEDADE-04: toda propriedade tem localização.
    latitude: numericField(latitudeSchema, "Este campo é obrigatório"),
    longitude: numericField(longitudeSchema, "Este campo é obrigatório"),
    // RN-PROPRIEDADE-05: o fuso do local da propriedade (sugerido pela localização na tela).
    timeZone: z.enum(BR_TIME_ZONES, "Selecione o fuso horário"),

    ...addressFields,
  })
  .check((ctx) => {
    const { totalArea, productiveArea } = ctx.value;

    // RN-PROPRIEDADE-03: a área produtiva não pode ser maior que a área total.
    const total = totalArea ? parseFloat(totalArea) : null;
    const productive = productiveArea ? parseFloat(productiveArea) : null;
    if (productive != null && total != null && productive > total) {
      ctx.issues.push({
        code: "custom",
        input: productiveArea,
        path: ["productiveArea"],
        message: "A área produtiva não pode ser maior que a área total.",
      });
    }

    checkAddress(ctx.value, ctx.issues);
  });

export type PropertyInput = z.infer<typeof propertySchema>;

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
