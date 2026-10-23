import { z } from "zod";
import { dateField } from "../date";
import { FIELD_LIMITS } from "../field-limits";

// Contratos da API de lotes. Os formulários validam com estes mesmos schemas (zodResolver
// em modo raw: a tela valida e envia os valores do formulário; a API converte).
// Datas como "AAAA-MM-DD"; o servidor converte.

const notes = z
  .string()
  .max(
    FIELD_LIMITS.batch.notes,
    `Máximo de ${FIELD_LIMITS.batch.notes} caracteres`,
  )
  .optional()
  .transform((v) => v || null);

/** Peso médio da meta: vazio = sem peso; preenchido, maior que zero (RN-LOTE-04). */
const targetWeight = z
  .string()
  .optional()
  .transform((v) => (v ? parseFloat(v) : null))
  .refine((v) => v == null || v > 0, "O peso deve ser maior que zero");

/** Campos do lote comuns ao cadastro e à edição (também usados pelo formulário). */
export const batchFieldsSchema = z.object({
  name: z
    .string()
    .min(1, "Este campo é obrigatório")
    .max(
      FIELD_LIMITS.batch.name,
      `Máximo de ${FIELD_LIMITS.batch.name} caracteres`,
    ),
  notes,
  hasMeta: z.boolean().optional().default(false),
  targetDate: dateField,
  targetWeight,
});

const GOAL_REQUIRED = "Este campo é obrigatório quando há meta.";

/** RN-LOTE-04: com meta, a data e o peso de venda são obrigatórios. */
export function requireBatchGoal(
  data: { hasMeta: boolean; targetDate?: string; targetWeight: number | null },
  ctx: z.RefinementCtx,
) {
  if (!data.hasMeta) return;
  if (!data.targetDate) {
    ctx.addIssue({
      code: "custom",
      path: ["targetDate"],
      message: GOAL_REQUIRED,
    });
  }
  if (data.targetWeight == null) {
    ctx.addIssue({
      code: "custom",
      path: ["targetWeight"],
      message: GOAL_REQUIRED,
    });
  }
}

export const batchCreateSchema = batchFieldsSchema
  .extend({
    areaId: z.uuid("Área inválida"),
    propertyId: z.uuid().optional(),
  })
  .superRefine(requireBatchGoal);

export type BatchCreatePayload = z.input<typeof batchCreateSchema>;
export type BatchCreateData = z.output<typeof batchCreateSchema>;

export const batchUpdateSchema = batchFieldsSchema
  .extend({
    newAreaId: z.uuid("Área inválida").optional(),
    areaChangeDescription: notes,
  })
  .superRefine(requireBatchGoal);

export type BatchUpdatePayload = z.input<typeof batchUpdateSchema>;
export type BatchUpdateData = z.output<typeof batchUpdateSchema>;

export const batchReopenSchema = z.object({
  areaId: z.uuid("Selecione a área do lote."),
  notes,
});

export type BatchReopenPayload = z.input<typeof batchReopenSchema>;
export type BatchReopenData = z.output<typeof batchReopenSchema>;

// Filtros e paginação da listagem (parâmetros da URL: chegam como texto e são convertidos).
export const batchQuerySchema = z.object({
  propertyId: z.uuid().optional(),
  page: z.coerce.number().int().min(0).optional().default(0),
  pageSize: z.coerce.number().int().min(1).optional().default(10),
  search: z.string().trim().optional().default(""),
  status: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.enum(["active", "inactive"]).optional(),
  ),
});

export type BatchQuery = z.output<typeof batchQuerySchema>;
/** Parâmetros que o cliente passa para listar (todos opcionais). */
export type BatchListParams = Partial<BatchQuery>;
