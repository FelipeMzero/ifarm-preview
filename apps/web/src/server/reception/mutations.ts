import "server-only";
import { z } from "zod";
import { receptionDocumentsSchema } from "@ifarm/shared";
import { prisma } from "@/server/db";
import { applyPlanSteps } from "../management-session/shared";
import { planStepSchema } from "../management-session/steps";
import { StepError } from "../management-session/steps/types";
import { validateReceptionInput } from "../purchase/reception";

// Abertura de recepção: documentos da carga, lote de entrada e os manejos feitos em cada
// animal recebido (opcional: receber já pode ser tudo). Fica no servidor porque o schema das
// etapas depende dos módulos de etapa.
export const createReceptionSchema = receptionDocumentsSchema.extend({
  entryBatchId: z.uuid("Selecione o lote de entrada."),
  steps: z.array(planStepSchema).default([]),
});

export type CreateReceptionData = z.output<typeof createReceptionSchema>;

// "Receber animais": abre uma recepção (viagem) da compra. A compra incorpora uma
// sessão de manejo, criada já iniciada com a data de hoje, para receber os animais e
// fazer os manejos de chegada.
export async function createReception(
  purchaseId: string,
  data: CreateReceptionData,
) {
  return prisma.$transaction(async (tx) => {
    const event = await tx.purchaseEvent.findUnique({
      where: { id: purchaseId },
      select: {
        destinationPropertyId: true,
        title: true,
        _count: { select: { receptions: true } },
      },
    });
    if (!event) throw new StepError("Compra não encontrada.", 404);

    const propertyId = event.destinationPropertyId;
    await validateReceptionInput(tx, propertyId, {
      purchaseEventId: purchaseId,
      entryBatchId: data.entryBatchId,
    });

    const trip = event._count.receptions + 1;
    const now = new Date();
    const session = await tx.managementSession.create({
      data: {
        propertyId,
        title: `Recepção ${trip} — ${event.title}`,
        scheduledAt: new Date(),
        performedAt: now,
      },
    });

    await applyPlanSteps(tx, { ...session, performedAt: now }, [], data.steps);

    const reception = await tx.purchaseReception.create({
      data: {
        purchaseEventId: purchaseId,
        managementSessionId: session.id,
        entryBatchId: data.entryBatchId,
        gtaNumber: data.gtaNumber,
        invoiceNumber: data.invoiceNumber,
      },
    });

    return { receptionId: reception.id, sessionId: session.id };
  });
}
