import { z } from "zod";
import { Sex, AnimalOrigin, AnimalStatus, PersonType, MaritalStatus } from "@/generated/prisma/enums";
import { isValidTaxId } from "@/lib/tax-id";
import { FIELD_LIMITS } from "@/lib/field-limits";


export const animalApiSchema = z.object({
  earTag:            z.string().min(1, "Este campo não pode ser vazio").max(FIELD_LIMITS.animal.earTag, `Máximo de ${FIELD_LIMITS.animal.earTag} caracteres`),

  rfid:              z.string().max(FIELD_LIMITS.animal.rfid, `Máximo de ${FIELD_LIMITS.animal.rfid} caracteres`).optional().transform(v => v || null),
  name:              z.string().max(FIELD_LIMITS.animal.name, `Máximo de ${FIELD_LIMITS.animal.name} caracteres`).optional().transform(v => v || null),
  motherId:          z.string().optional().transform(v => v || null),
  fatherId:          z.string().optional().transform(v => v || null),
  breedId:           z.string().optional().transform(v => v || null),
  originPropertyId:  z.string().optional().transform(v => v || null),
  originPropertyName: z.string().max(FIELD_LIMITS.animal.originPropertyName, `Máximo de ${FIELD_LIMITS.animal.originPropertyName} caracteres`).optional().transform(v => v || null),

  sex:               z.preprocess( v => v === "" ? undefined : v, z.enum(Sex).optional()),
  origin:            z.preprocess( v => v === "" ? undefined : v, z.enum(AnimalOrigin).optional()),
  status:            z.preprocess( v => v === "" ? undefined : v, z.enum(AnimalStatus).optional()),

  birthDate:         z.string().optional().transform(v => v ? new Date(`${v}T00:00:00`) : null),
  birthWeightKg:     z.string().optional().transform(v => v ? parseFloat(v) : null),
  batchId:           z.string().optional().transform(v => v ? parseInt(v) : null),
  acquisitionDate:   z.string().optional().transform(v => v ? new Date(`${v}T00:00:00`) : null),
  purchasePrice:     z.string().optional().transform(v => v ? parseFloat(v) : null),
  entryAgeMonths:    z.string().optional().transform(v => v ? parseInt(v) : null),
  currentWeightKg:   z.string().optional().transform(v => v ? parseFloat(v) : null),
});

export const animalQuerySchema = z.object({
  page:     z.coerce.number().int().min(0).optional().default(0),
  pageSize: z.coerce.number().int().min(1).optional().default(10),
  search:   z.string().trim().optional().default(""),
  status:   z.preprocess( v => v === "" ? undefined : v, z.enum(AnimalStatus).optional()),
  sex:      z.preprocess( v => v === "" ? undefined : v, z.enum(Sex).optional()),
});

export type AnimalQueryData = z.infer<typeof animalQuerySchema>;



export const personApiSchema = z
  .object({
    type:              z.enum(PersonType),
    taxId:             z.string().min(1, "Este campo não pode ser vazio"),
    name:              z.string().min(1, "Este campo não pode ser vazio").max(FIELD_LIMITS.person.name, `Máximo de ${FIELD_LIMITS.person.name} caracteres`),

    stateRegistration: z.string().max(FIELD_LIMITS.person.stateRegistration, `Máximo de ${FIELD_LIMITS.person.stateRegistration} caracteres`).optional().transform(v => v || null),
    phone:             z.string().optional().transform(v => v || null),
    email:             z.string().max(FIELD_LIMITS.person.email, `Máximo de ${FIELD_LIMITS.person.email} caracteres`).optional().transform(v => v || null),

    // Exclusivo de Pessoa Jurídica
    tradeName:         z.string().max(FIELD_LIMITS.person.tradeName, `Máximo de ${FIELD_LIMITS.person.tradeName} caracteres`).optional().transform(v => v || null),

    // Exclusivos de Pessoa Física
    rg:                z.string().max(FIELD_LIMITS.person.rg, `Máximo de ${FIELD_LIMITS.person.rg} caracteres`).optional().transform(v => v || null),
    birthDate:         z.string().optional().transform(v => v ? new Date(`${v}T00:00:00`) : null),
    maritalStatus:     z.preprocess( v => v === "" ? undefined : v, z.enum(MaritalStatus).optional()),

    // Endereço
    zipCode:           z.string().optional().transform(v => v || null),
    street:            z.string().max(FIELD_LIMITS.address.street, `Máximo de ${FIELD_LIMITS.address.street} caracteres`).optional().transform(v => v || null),
    number:            z.string().max(FIELD_LIMITS.address.number, `Máximo de ${FIELD_LIMITS.address.number} caracteres`).optional().transform(v => v || null),
    complement:        z.string().max(FIELD_LIMITS.address.complement, `Máximo de ${FIELD_LIMITS.address.complement} caracteres`).optional().transform(v => v || null),
    neighborhood:      z.string().max(FIELD_LIMITS.address.neighborhood, `Máximo de ${FIELD_LIMITS.address.neighborhood} caracteres`).optional().transform(v => v || null),
    city:              z.string().max(FIELD_LIMITS.address.city, `Máximo de ${FIELD_LIMITS.address.city} caracteres`).optional().transform(v => v || null),
    state:             z.string().optional().transform(v => v || null),
  })
  .check((ctx) => {
    const { type, taxId, zipCode, street, city, state } = ctx.value;

    if (taxId && !isValidTaxId(type, taxId)) {
      ctx.issues.push({
        code: "custom",
        input: taxId,
        path: ["taxId"],
        message: type === PersonType.INDIVIDUAL ? "CPF inválido" : "CNPJ inválido",
      });
    }

    const addressStarted = zipCode || street || city || state;
    if (addressStarted) {
      if (!zipCode) ctx.issues.push({ code: "custom", input: zipCode, path: ["zipCode"], message: "Este campo não pode ser vazio" });
      if (!street) ctx.issues.push({ code: "custom", input: street, path: ["street"], message: "Este campo não pode ser vazio" });
      if (!city) ctx.issues.push({ code: "custom", input: city, path: ["city"], message: "Este campo não pode ser vazio" });
      if (!state) ctx.issues.push({ code: "custom", input: state, path: ["state"], message: "Este campo não pode ser vazio" });
    }
  });

export type PersonApiData = z.infer<typeof personApiSchema>;

export const personQuerySchema = z.object({
  page:     z.coerce.number().int().min(0).optional().default(0),
  pageSize: z.coerce.number().int().min(1).optional().default(10),
  search:   z.string().trim().optional().default(""),
  type:     z.preprocess( v => v === "" ? undefined : v, z.enum(PersonType).optional()),
  status:   z.preprocess( v => v === "" ? undefined : v, z.enum(["active", "inactive"]).optional()),
});

export type PersonQueryData = z.infer<typeof personQuerySchema>;



export const propertyApiSchema = z
  .object({
    name:           z.string().min(1, "Este campo não pode ser vazio").max(FIELD_LIMITS.property.name, `Máximo de ${FIELD_LIMITS.property.name} caracteres`),
    ownerId:        z.string().min(1, "Este campo não pode ser vazio"),

    totalArea:      z.string().optional().transform(v => v ? parseFloat(v) : null),
    productiveArea: z.string().optional().transform(v => v ? parseFloat(v) : null),
    cib:            z.string().max(FIELD_LIMITS.property.cib, `Máximo de ${FIELD_LIMITS.property.cib} caracteres`).optional().transform(v => v || null),
    ccir:           z.string().optional().transform(v => v || null),
    car:            z.string().optional().transform(v => v || null),
    latitude:       z.preprocess(v => v === "" ? undefined : v, z.coerce.number().min(-90, "Latitude deve estar entre -90 e 90.").max(90, "Latitude deve estar entre -90 e 90.").optional()).transform(v => v ?? null),
    longitude:      z.preprocess(v => v === "" ? undefined : v, z.coerce.number().min(-180, "Longitude deve estar entre -180 e 180.").max(180, "Longitude deve estar entre -180 e 180.").optional()).transform(v => v ?? null),

    // Endereço
    zipCode:        z.string().optional().transform(v => v || null),
    street:         z.string().max(FIELD_LIMITS.address.street, `Máximo de ${FIELD_LIMITS.address.street} caracteres`).optional().transform(v => v || null),
    number:         z.string().max(FIELD_LIMITS.address.number, `Máximo de ${FIELD_LIMITS.address.number} caracteres`).optional().transform(v => v || null),
    complement:     z.string().max(FIELD_LIMITS.address.complement, `Máximo de ${FIELD_LIMITS.address.complement} caracteres`).optional().transform(v => v || null),
    neighborhood:   z.string().max(FIELD_LIMITS.address.neighborhood, `Máximo de ${FIELD_LIMITS.address.neighborhood} caracteres`).optional().transform(v => v || null),
    city:           z.string().max(FIELD_LIMITS.address.city, `Máximo de ${FIELD_LIMITS.address.city} caracteres`).optional().transform(v => v || null),
    state:          z.string().optional().transform(v => v || null),
  })
  .check((ctx) => {
    const { totalArea, productiveArea, zipCode, street, city, state } = ctx.value;

    // RN-PROPRIEDADE-03: a área produtiva não pode ser maior que a área total.
    if (productiveArea != null && totalArea != null && productiveArea > totalArea) {
      ctx.issues.push({
        code: "custom",
        input: productiveArea,
        path: ["productiveArea"],
        message: "A área produtiva não pode ser maior que a área total.",
      });
    }

    const addressStarted = zipCode || street || city || state;
    if (addressStarted) {
      if (!zipCode) ctx.issues.push({ code: "custom", input: zipCode, path: ["zipCode"], message: "Este campo não pode ser vazio" });
      if (!street) ctx.issues.push({ code: "custom", input: street, path: ["street"], message: "Este campo não pode ser vazio" });
      if (!city) ctx.issues.push({ code: "custom", input: city, path: ["city"], message: "Este campo não pode ser vazio" });
      if (!state) ctx.issues.push({ code: "custom", input: state, path: ["state"], message: "Este campo não pode ser vazio" });
    }
  });

export type PropertyApiData = z.infer<typeof propertyApiSchema>;

export const propertyQuerySchema = z.object({
  page:     z.coerce.number().int().min(0).optional().default(0),
  pageSize: z.coerce.number().int().min(1).optional().default(10),
  search:   z.string().trim().optional().default(""),
  status:   z.preprocess( v => v === "" ? undefined : v, z.enum(["active", "inactive"]).optional()),
});

export type PropertyQueryData = z.infer<typeof propertyQuerySchema>;



export const breedApiSchema = z.object({
  name: z.string().min(1, "Este campo não pode ser vazio").max(FIELD_LIMITS.breed.name, `Máximo de ${FIELD_LIMITS.breed.name} caracteres`),
});

export type BreedApiData = z.infer<typeof breedApiSchema>;



export const areaApiSchema = z.object({
  name: z.string().min(1, "Este campo é obrigatório").max(FIELD_LIMITS.area.name, `Máximo de ${FIELD_LIMITS.area.name} caracteres`),
  polygon: z.any(),
  hectares: z.preprocess(v => v === "" ? undefined : v, z.coerce.number().min(0, "Hectares não pode ser negativo")),
  stockingRate: z.preprocess(v => v === "" ? undefined : v, z.coerce.number().min(0, "Taxa de lotação não pode ser negativa")),
  notes: z.string().max(FIELD_LIMITS.area.notes, `Máximo de ${FIELD_LIMITS.area.notes} caracteres`).optional().nullable().transform(v => v || null),
  propertyId: z.string().uuid("Propriedade inválida"),
});

export type AreaApiData = z.infer<typeof areaApiSchema>;

export const areaQuerySchema = z.object({
  propertyId: z.string().uuid().optional(),
  status: z.enum(["active", "inactive"]).optional().default("active"),
});

export type AreaQueryData = z.infer<typeof areaQuerySchema>;