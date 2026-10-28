import { z } from "zod";
import { addressFields, checkAddress } from "../address/schema";
import { dateField } from "../date";
import { MaritalStatus, PersonType } from "../enums";
import { FIELD_LIMITS } from "../field-limits";
import { isValidTaxId } from "./tax-id";

// Dados de uma pessoa: o formulário envia textos, com "" para campo vazio; o schema valida (no
// formulário e de novo na API) e converte o vazio em null. A data vai para o banco pelo servidor.
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
      .optional()
      .transform((v) => v || null),
    phone: z
      .string()
      .optional()
      .transform((v) => v || null),
    email: z
      .string()
      .max(
        FIELD_LIMITS.person.email,
        `Máximo de ${FIELD_LIMITS.person.email} caracteres`,
      )
      .optional()
      .transform((v) => v || null),

    // Exclusivo de Pessoa Jurídica
    tradeName: z
      .string()
      .max(
        FIELD_LIMITS.person.tradeName,
        `Máximo de ${FIELD_LIMITS.person.tradeName} caracteres`,
      )
      .optional()
      .transform((v) => v || null),

    // Exclusivos de Pessoa Física
    rg: z
      .string()
      .max(
        FIELD_LIMITS.person.rg,
        `Máximo de ${FIELD_LIMITS.person.rg} caracteres`,
      )
      .optional()
      .transform((v) => v || null),
    birthDate: dateField.transform((v) => v || null),
    maritalStatus: z
      .union([z.enum(MaritalStatus), z.literal("")])
      .optional()
      .transform((v) => v || null),

    ...addressFields,
  })
  .check((ctx) => {
    const { type, taxId, email } = ctx.value;

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

    checkAddress(ctx.value, ctx.issues);
  });

/** O que o formulário envia (textos, "" para vazio). */
export type PersonPayload = z.input<typeof personSchema>;
/** O que a API recebe depois da validação: vazios como null. */
export type PersonData = z.output<typeof personSchema>;

// Filtros e paginação da listagem (parâmetros da URL: chegam como texto e são convertidos).
export const personQuerySchema = z.object({
  page: z.coerce.number().int().min(0).optional().default(0),
  pageSize: z.coerce.number().int().min(1).optional().default(10),
  search: z.string().trim().optional().default(""),
  type: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.enum(PersonType).optional(),
  ),
  status: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.enum(["active", "inactive"]).optional(),
  ),
});

export type PersonQuery = z.output<typeof personQuerySchema>;
/** Parâmetros que o cliente passa para listar (todos opcionais). */
export type PersonListParams = Partial<PersonQuery>;
