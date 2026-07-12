import { z } from "zod";
import { Sex, AnimalOrigin, AnimalStatus, PersonType, MaritalStatus } from "@/generated/prisma/enums";
import { isValidTaxId } from "@/lib/tax-id";


export const animalApiSchema = z.object({
  earTag:            z.string().min(1, "Este campo não pode ser vazio"),

  rfid:              z.string().optional().transform(v => v || null),
  name:              z.string().optional().transform(v => v || null),
  motherId:          z.string().optional().transform(v => v || null),
  fatherId:          z.string().optional().transform(v => v || null),
  originFarmName:    z.string().optional().transform(v => v || null),

  sex:               z.preprocess( v => v === "" ? undefined : v, z.enum(Sex).optional()),
  origin:            z.preprocess( v => v === "" ? undefined : v, z.enum(AnimalOrigin).optional()),
  status:            z.preprocess( v => v === "" ? undefined : v, z.enum(AnimalStatus).optional()),

  birthDate:         z.string().optional().transform(v => v ? new Date(`${v}T00:00:00`) : null),
  birthWeightKg:     z.string().optional().transform(v => v ? parseFloat(v) : null),
  breedId:           z.string().optional().transform(v => v ? parseInt(v) : null),
  batchId:           z.string().optional().transform(v => v ? parseInt(v) : null),
  originFarmId:      z.string().optional().transform(v => v ? parseInt(v) : null),
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
    name:              z.string().min(1, "Este campo não pode ser vazio"),

    stateRegistration: z.string().optional().transform(v => v || null),
    phone:             z.string().optional().transform(v => v || null),
    email:             z.string().optional().transform(v => v || null),

    // Exclusivo de Pessoa Jurídica
    tradeName:         z.string().optional().transform(v => v || null),

    // Exclusivos de Pessoa Física
    rg:                z.string().optional().transform(v => v || null),
    birthDate:         z.string().optional().transform(v => v ? new Date(`${v}T00:00:00`) : null),
    maritalStatus:     z.preprocess( v => v === "" ? undefined : v, z.enum(MaritalStatus).optional()),

    // Endereço
    zipCode:           z.string().optional().transform(v => v || null),
    street:            z.string().optional().transform(v => v || null),
    number:            z.string().optional().transform(v => v || null),
    complement:        z.string().optional().transform(v => v || null),
    neighborhood:      z.string().optional().transform(v => v || null),
    city:              z.string().optional().transform(v => v || null),
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
});

export type PersonQueryData = z.infer<typeof personQuerySchema>;



export const propertyApiSchema = z
  .object({
    name:           z.string().min(1, "Este campo não pode ser vazio"),
    ownerId:        z.string().min(1, "Este campo não pode ser vazio"),

    totalArea:      z.string().optional().transform(v => v ? parseFloat(v) : null),
    productiveArea: z.string().optional().transform(v => v ? parseFloat(v) : null),
    cib:            z.string().optional().transform(v => v || null),
    ccir:           z.string().optional().transform(v => v || null),
    car:            z.string().optional().transform(v => v || null),
    latitude:       z.string().optional().transform(v => v ? parseFloat(v) : null),
    longitude:      z.string().optional().transform(v => v ? parseFloat(v) : null),

    // Endereço
    zipCode:        z.string().optional().transform(v => v || null),
    street:         z.string().optional().transform(v => v || null),
    number:         z.string().optional().transform(v => v || null),
    complement:     z.string().optional().transform(v => v || null),
    neighborhood:   z.string().optional().transform(v => v || null),
    city:           z.string().optional().transform(v => v || null),
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
});

export type PropertyQueryData = z.infer<typeof propertyQuerySchema>;