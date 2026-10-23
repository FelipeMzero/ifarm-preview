import { z } from "zod";
import { planStepSchema } from "../management-session/plan-steps";
import { receptionDocumentsSchema } from "../purchase/schema";

// Abertura de uma recepção (viagem) de compra: documentos da carga, lote de entrada e os
// manejos feitos em cada animal recebido (opcionais: receber os animais já é o trabalho).
export const createReceptionSchema = receptionDocumentsSchema.extend({
  entryBatchId: z.uuid("Selecione o lote de entrada."),
  steps: z.array(planStepSchema).default([]),
});

export type CreateReceptionPayload = z.input<typeof createReceptionSchema>;
export type CreateReceptionData = z.output<typeof createReceptionSchema>;

// Filtros e paginação da listagem (parâmetros da URL: chegam como texto e são convertidos).
export const receptionPurchaseQuerySchema = z.object({
  propertyId: z.uuid().optional(),
  page: z.coerce.number().int().min(0).optional().default(0),
  pageSize: z.coerce.number().int().min(1).optional().default(10),
  search: z.string().trim().optional().default(""),
  // "pending" = a receber (padrão); "all" = todas as não canceladas.
  filter: z.enum(["pending", "all"]).optional().default("pending"),
});

export type ReceptionPurchaseQuery = z.output<
  typeof receptionPurchaseQuerySchema
>;
/** Parâmetros que o cliente passa para listar (todos opcionais). */
export type ReceptionPurchaseListParams = Partial<ReceptionPurchaseQuery>;
