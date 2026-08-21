import { z } from "zod";

export function optionalNumericField<T extends z.ZodType>(schema: T) {
  return z.string().optional().superRefine((v, ctx) => {
    if (!v) return;
    const result = schema.safeParse(v);
    if (!result.success) {
      ctx.addIssue({
        code: "custom",
        message: result.error.issues[0]?.message ?? "Valor inválido.",
      });
    }
  });
}

export function numericField<T extends z.ZodType>(schema: T, requiredMessage = "Este campo não pode ser vazio") {
  return z.string().min(1, requiredMessage).superRefine((v, ctx) => {
    const result = schema.safeParse(v);
    if (!result.success) {
      ctx.addIssue({
        code: "custom",
        message: result.error.issues[0]?.message ?? "Valor inválido.",
      });
    }
  });
}
