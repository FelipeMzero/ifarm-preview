import { z } from "zod";
import { FIELD_LIMITS } from "../field-limits";

// Contrato da API de transferências entre lotes (o formulário tem estado próprio, em
// features/batch-transfer/schema.ts). Data como "AAAA-MM-DD"; o servidor converte.
export const batchTransferSchema = z.object({
  destinationBatchId: z.uuid("Selecione o lote de destino."),
  transferDate: z.iso.date("Informe uma data válida."),
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
