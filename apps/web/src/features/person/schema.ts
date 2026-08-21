import { z } from "zod";
import { isValidTaxId } from "@/lib/tax-id";
import { FIELD_LIMITS } from "@/lib/field-limits";

const enumValues = <T extends Record<string, string>>(e: T) =>
  Object.values(e) as [T[keyof T], ...T[keyof T][]];

export const EnumPersonType = {
  INDIVIDUAL: "INDIVIDUAL",
  COMPANY: "COMPANY",
} as const;
export const EnumMaritalStatus = {
  SINGLE: "SINGLE",
  MARRIED: "MARRIED",
  STABLE_UNION: "STABLE_UNION",
  DIVORCED: "DIVORCED",
  WIDOWED: "WIDOWED",
} as const;

export const personFormSchema = z
  .object({
    type: z.enum(enumValues(EnumPersonType), "Este campo não pode ser vazio"),
    taxId: z.string().min(1, "Este campo não pode ser vazio"),
    name: z
      .string()
      .min(1, "Este campo não pode ser vazio")
      .max(
        FIELD_LIMITS.person.name,
        `Máximo de ${FIELD_LIMITS.person.name} caracteres`,
      ),
    stateRegistration: z
      .string()
      .max(
        FIELD_LIMITS.person.stateRegistration,
        `Máximo de ${FIELD_LIMITS.person.stateRegistration} caracteres`,
      )
      .optional(),
    phone: z.string().optional(),
    email: z
      .string()
      .max(
        FIELD_LIMITS.person.email,
        `Máximo de ${FIELD_LIMITS.person.email} caracteres`,
      )
      .optional(),

    // Exclusivo de Pessoa Jurídica
    tradeName: z
      .string()
      .max(
        FIELD_LIMITS.person.tradeName,
        `Máximo de ${FIELD_LIMITS.person.tradeName} caracteres`,
      )
      .optional(),

    // Exclusivos de Pessoa Física
    rg: z
      .string()
      .max(
        FIELD_LIMITS.person.rg,
        `Máximo de ${FIELD_LIMITS.person.rg} caracteres`,
      )
      .optional(),
    birthDate: z.string().optional(),
    maritalStatus: z.string().optional(),

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
    const { type, taxId, email, zipCode, street, city, state } = ctx.value;

    if (taxId && !isValidTaxId(type, taxId)) {
      ctx.issues.push({
        code: "custom",
        input: taxId,
        path: ["taxId"],
        message:
          type === EnumPersonType.INDIVIDUAL ? "CPF inválido" : "CNPJ inválido",
      });
    }

    if (email && !z.email().safeParse(email).success) {
      ctx.issues.push({
        code: "custom",
        input: email,
        path: ["email"],
        message: "E-mail inválido",
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

export type PersonFormData = z.infer<typeof personFormSchema>;
