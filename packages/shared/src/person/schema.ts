import { z } from "zod";
import { addressFields, checkAddress } from "../address/schema";
import { dateField } from "../date";
import { MaritalStatus, PersonType } from "../enums";
import { FIELD_LIMITS } from "../field-limits";
import { isValidTaxId } from "./tax-id";

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

export type PersonInput = z.infer<typeof personSchema>;

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
