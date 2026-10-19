import { z } from "zod";
import { dateField } from "../date";
import { MaritalStatus, PersonType } from "../enums";
import { FIELD_LIMITS } from "../field-limits";
import { isValidTaxId } from "../tax-id";

// Dados de uma pessoa como o usuário os informa: textos, com "" para campo vazio. Validado no
// formulário e de novo na API; a conversão para o formato do banco fica no servidor.
export const personSchema = z
  .object({
    type: z.enum(PersonType, "Este campo não pode ser vazio"),
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
    birthDate: dateField,
    maritalStatus: z.union([z.enum(MaritalStatus), z.literal("")]).optional(),

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

    // RN-PESSOA-01
    if (taxId && !isValidTaxId(type, taxId)) {
      ctx.issues.push({
        code: "custom",
        input: taxId,
        path: ["taxId"],
        message:
          type === PersonType.INDIVIDUAL ? "CPF inválido" : "CNPJ inválido",
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

    // Endereço é tudo ou nada: começou a preencher, CEP, logradouro, cidade e UF passam a ser
    // obrigatórios.
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

export type PersonInput = z.infer<typeof personSchema>;
