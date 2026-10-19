import { z } from "zod";
import { dateField } from "../date";
import { Sex } from "../enums";

// Pedido de prévia de lotação: a área (ou o lote, ou uma transferência salva) e o que vai entrar
// nela, entre animais cadastrados, lotes inteiros e animais ainda não cadastrados.
export const stockingPreviewSchema = z.object({
  areaId: z.uuid().optional(),
  batchId: z.uuid().optional(),
  transferId: z.uuid().optional(),
  animalIds: z.array(z.uuid()).optional().default([]),
  batchIds: z.array(z.uuid()).optional().default([]),
  newAnimals: z
    .array(
      z.object({
        weightKg: z.number().positive().nullable().optional(),
        birthDate: dateField,
        sex: z.enum(Sex),
        neutered: z.boolean().optional().default(false),
      }),
    )
    .optional()
    .default([]),
});

export type StockingPreviewRequest = z.input<typeof stockingPreviewSchema>;
