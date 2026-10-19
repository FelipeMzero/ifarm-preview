import { z } from "zod";
import { FIELD_LIMITS } from "@ifarm/shared";

export const batchTransferFormSchema = z.object({
  destinationBatchId: z.string().min(1, "Este campo é obrigatório"),
  transferDate: z.string().min(1, "Este campo é obrigatório"),
  notes: z
    .string()
    .max(
      FIELD_LIMITS.batchTransfer.notes,
      `Máximo de ${FIELD_LIMITS.batchTransfer.notes} caracteres`,
    )
    .optional(),
});

export type BatchTransferFormData = z.infer<typeof batchTransferFormSchema>;
