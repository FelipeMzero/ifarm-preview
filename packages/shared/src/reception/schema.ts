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
