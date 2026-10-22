import { z } from "zod";
import { dateTimeField } from "../date";
import { FIELD_LIMITS } from "../field-limits";

// Contrato da API de transferências entre lotes. O formulário valida com este schema (sem
// animalIds e propertyId, que ele completa no envio). Data e hora como "AAAA-MM-DDTHH:mm";
// o servidor converte.
export const batchTransferSchema = z.object({
  destinationBatchId: z.uuid("Selecione o lote de destino."),
  // Data e hora programadas ("AAAA-MM-DDTHH:mm", no fuso local).
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
