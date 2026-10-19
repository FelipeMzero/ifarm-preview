import { z } from "zod";
import { dateField } from "../date";
import { FIELD_LIMITS } from "../field-limits";

// Contratos da API de lotes (o formulário tem estado próprio, em features/batch/schema.ts).
// Datas como "AAAA-MM-DD"; o servidor converte.

const targetWeight = z
  .string()
  .optional()
  .transform((v) => (v ? parseFloat(v) : null));

export const batchCreateSchema = z.object({
  name: z
    .string()
    .min(1, "Este campo é obrigatório")
    .max(100, "Máximo de 100 caracteres"),
  notes: z
    .string()
    .max(500, "Máximo de 500 caracteres")
    .optional()
    .transform((v) => v || null),
  areaId: z.uuid("Área inválida"),
  propertyId: z.uuid().optional(),
  hasMeta: z.boolean().optional().default(false),
  targetDate: dateField,
  targetWeight,
});

export type BatchCreatePayload = z.input<typeof batchCreateSchema>;
export type BatchCreateData = z.output<typeof batchCreateSchema>;

export const batchUpdateSchema = z.object({
  name: z
    .string()
    .min(1, "Este campo é obrigatório")
    .max(100, "Máximo de 100 caracteres"),
  notes: z
    .string()
    .max(500, "Máximo de 500 caracteres")
    .optional()
    .transform((v) => v || null),
  hasMeta: z.boolean().optional().default(false),
  targetDate: dateField,
  targetWeight,
  newAreaId: z.uuid("Área inválida").optional(),
  areaChangeDescription: z
    .string()
    .max(500, "Máximo de 500 caracteres")
    .optional()
    .transform((v) => v || null),
});

export type BatchUpdatePayload = z.input<typeof batchUpdateSchema>;
export type BatchUpdateData = z.output<typeof batchUpdateSchema>;

export const batchReopenSchema = z.object({
  areaId: z.uuid("Selecione a área do lote."),
  notes: z
    .string()
    .max(
      FIELD_LIMITS.batch.notes,
      `Máximo de ${FIELD_LIMITS.batch.notes} caracteres`,
    )
    .optional()
    .transform((v) => v || null),
});

export type BatchReopenPayload = z.input<typeof batchReopenSchema>;
export type BatchReopenData = z.output<typeof batchReopenSchema>;
