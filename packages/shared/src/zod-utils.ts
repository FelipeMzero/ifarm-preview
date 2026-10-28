import { z } from "zod";

// Campos numéricos de formulário: chegam como texto (o <input>) ou número e saem como número.
// Não usam z.coerce, que tornaria o tipo de entrada `unknown` (ver AGENTS.md). A mensagem de
// valor inválido vem do `schema` (ex.: z.number("Valor inválido.")).

/** Número obrigatório: vazio é recusado com `requiredMessage`. */
export function numberField(
  schema: z.ZodNumber,
  requiredMessage = "Este campo não pode ser vazio",
) {
  return z
    .union([z.string(), z.number()])
    .refine((v) => v !== "", requiredMessage)
    .transform(Number)
    .pipe(schema);
}

/** Número opcional: vazio ou ausente vira null. */
export function optionalNumberField(schema: z.ZodNumber) {
  return z
    .union([z.string(), z.number(), z.null()])
    .optional()
    .transform((v) => (v === "" || v == null ? null : Number(v)))
    .pipe(schema.nullable());
}
