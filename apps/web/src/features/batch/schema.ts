import { z } from "zod";
import { FIELD_LIMITS } from "@ifarm/shared";

export const batchFormSchema = z
  .object({
    name: z
      .string()
      .min(1, "Este campo é obrigatório")
      .max(
        FIELD_LIMITS.batch.name,
        `Máximo de ${FIELD_LIMITS.batch.name} caracteres`,
      ),
    areaId: z.string().min(1, "Este campo é obrigatório"),
    notes: z
      .string()
      .max(
        FIELD_LIMITS.batch.notes,
        `Máximo de ${FIELD_LIMITS.batch.notes} caracteres`,
      )
      .optional(),
    hasMeta: z.boolean(),
    targetDate: z.string().optional(),
    targetWeight: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.hasMeta) {
      if (!data.targetDate) {
        ctx.addIssue({
          code: "custom",
          path: ["targetDate"],
          message: "Este campo é obrigatório quando há meta.",
        });
      }
      if (!data.targetWeight) {
        ctx.addIssue({
          code: "custom",
          path: ["targetWeight"],
          message: "Este campo é obrigatório quando há meta.",
        });
      }
    }
  });

export type BatchFormData = z.infer<typeof batchFormSchema>;

export const batchAreaChangeSchema = z.object({
  newAreaId: z.string().min(1, "A área de destino deve ser selecionada."),
  description: z
    .string()
    .max(
      FIELD_LIMITS.batch.notes,
      `Máximo de ${FIELD_LIMITS.batch.notes} caracteres`,
    )
    .optional(),
});

export type BatchAreaChangeData = z.infer<typeof batchAreaChangeSchema>;
