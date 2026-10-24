import { z } from "zod";
import { FIELD_LIMITS } from "../field-limits";

// Campos de endereço comuns a pessoa e propriedade, como o usuário os informa ("" para vazio).
export const addressFields = {
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
};

type AddressValue = {
  zipCode?: string;
  street?: string;
  city?: string;
  state?: string;
};

type Issue = {
  code: "custom";
  input: unknown;
  path: string[];
  message: string;
};

/**
 * Endereço é tudo ou nada: começou a preencher, CEP, logradouro, cidade e UF passam a ser
 * obrigatórios. Usar dentro do `.check` do schema que contém `addressFields`.
 */
export function checkAddress(
  value: AddressValue,
  issues: { push(issue: Issue): unknown },
) {
  const required = ["zipCode", "street", "city", "state"] as const;
  if (!required.some((field) => value[field])) return;

  for (const field of required) {
    if (!value[field]) {
      issues.push({
        code: "custom",
        input: value[field],
        path: [field],
        message: "Este campo não pode ser vazio",
      });
    }
  }
}

// Busca de coordenadas por endereço (parâmetros da URL de /api/address/geocode). Todos opcionais:
// a API tenta o endereço completo, depois só o CEP e, por fim, a cidade com o estado.
export const geocodeQuerySchema = z.object({
  street: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  zipCode: z.string().trim().optional(),
});

export type GeocodeParams = z.input<typeof geocodeQuerySchema>;
export type GeocodeQuery = z.output<typeof geocodeQuerySchema>;
