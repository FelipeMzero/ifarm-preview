import { z } from "zod";
import { dateTimeField } from "../date";
import { FIELD_LIMITS } from "../field-limits";

// Contrato da API de transferências entre lotes. O formulário valida com este schema (sem
// animalIds e propertyId, que ele completa no envio). Data e hora como "AAAA-MM-DDTHH:mm";
// o servidor converte.
export const batchTransferSchema = z.object({
  destinationBatchId: z.uuid("Selecione o lote de destino."),
  // Data e hora programadas ("AAAA-MM-DDTHH:mm", no fuso da propriedade).
  transferredAt: dateTimeField,
  notes: z
    .string()
    .max(
      FIELD_LIMITS.batchTransfer.notes,
      `Máximo de ${FIELD_LIMITS.batchTransfer.notes} caracteres`,
    )
    .optional()
    .transform((v) => v || null),
  animalIds: z.array(z.uuid()).default([]),
  propertyId: z.uuid().optional(),
});

export type BatchTransferPayload = z.input<typeof batchTransferSchema>;
export type BatchTransferData = z.output<typeof batchTransferSchema>;

// Filtros e paginação da listagem (parâmetros da URL: chegam como texto e são convertidos).
export const batchTransferQuerySchema = z.object({
  propertyId: z.uuid().optional(),
  page: z.coerce.number().int().min(0).optional().default(0),
  pageSize: z.coerce.number().int().min(1).optional().default(10),
  search: z.string().trim().optional().default(""),
  status: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.enum(["pending", "confirmed", "cancelled"]).optional(),
  ),
});

export type BatchTransferQuery = z.output<typeof batchTransferQuerySchema>;
/** Parâmetros que o cliente passa para listar (todos opcionais). */
export type BatchTransferListParams = Partial<BatchTransferQuery>;
