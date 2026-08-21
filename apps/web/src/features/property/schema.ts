import { z } from "zod";
import { FIELD_LIMITS } from "@/lib/field-limits";
import { optionalNumericField } from "@/lib/zod-utils";

export const latitudeSchema = z.coerce
  .number()
  .min(-90, "Latitude deve estar entre -90 e 90.")
  .max(90, "Latitude deve estar entre -90 e 90.");

export const longitudeSchema = z.coerce
  .number()
  .min(-180, "Longitude deve estar entre -180 e 180.")
  .max(180, "Longitude deve estar entre -180 e 180.");

export const areaSchema = z.coerce
  .number()
  .positive("Valor inválido.")
  .max(FIELD_LIMITS.property.area, "Limite ultrapassado");

export const propertyFormSchema = z
  .object({
    name: z
      .string()
      .min(1, "Este campo não pode ser vazio")
      .max(
        FIELD_LIMITS.property.name,
        `Máximo de ${FIELD_LIMITS.property.name} caracteres`,
      ),
    ownerId: z.string().min(1, "Este campo não pode ser vazio"),
    ownerName: z.string().optional(),

    totalArea: optionalNumericField(areaSchema),
    productiveArea: optionalNumericField(areaSchema),

    cib: z
      .string()
      .max(
        FIELD_LIMITS.property.cib,
        `Máximo de ${FIELD_LIMITS.property.cib} caracteres`,
      )
      .optional(),
    ccir: z.string().optional(),
    car: z.string().optional(),
    latitude: optionalNumericField(latitudeSchema),
    longitude: optionalNumericField(longitudeSchema),

    // Endereço
    zipCode: z.string().optional(),
    street: z
      .string()
      .max(
        FIELD_LIMITS.address.street,
        `Máximo de ${FIELD_LIMITS.address.street} caracteres`,
      )
      .optional(),
    number: z
      .string()
      .max(
        FIELD_LIMITS.address.number,
        `Máximo de ${FIELD_LIMITS.address.number} caracteres`,
      )
      .optional(),
    complement: z
      .string()
      .max(
        FIELD_LIMITS.address.complement,
        `Máximo de ${FIELD_LIMITS.address.complement} caracteres`,
      )
      .optional(),
    neighborhood: z
      .string()
      .max(
        FIELD_LIMITS.address.neighborhood,
        `Máximo de ${FIELD_LIMITS.address.neighborhood} caracteres`,
      )
      .optional(),
    city: z
      .string()
      .max(
        FIELD_LIMITS.address.city,
        `Máximo de ${FIELD_LIMITS.address.city} caracteres`,
      )
      .optional(),
    state: z.string().optional(),
  })
  .check((ctx) => {
    const { totalArea, productiveArea, zipCode, street, city, state } =
      ctx.value;

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

    const addressStarted = zipCode || street || city || state;
    if (addressStarted) {
      if (!zipCode)
        ctx.issues.push({
          code: "custom",
          input: zipCode,
          path: ["zipCode"],
          message: "Este campo não pode ser vazio",
        });
      if (!street)
        ctx.issues.push({
          code: "custom",
          input: street,
          path: ["street"],
          message: "Este campo não pode ser vazio",
        });
      if (!city)
        ctx.issues.push({
          code: "custom",
          input: city,
          path: ["city"],
          message: "Este campo não pode ser vazio",
        });
      if (!state)
        ctx.issues.push({
          code: "custom",
          input: state,
          path: ["state"],
          message: "Este campo não pode ser vazio",
        });
    }
  });

export type PropertyFormData = z.infer<typeof propertyFormSchema>;
