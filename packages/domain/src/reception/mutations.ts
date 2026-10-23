import "server-only";
import type { CreateReceptionData } from "@ifarm/shared";
import { prisma } from "@/server/db";
import { applyPlanSteps } from "../management-session/shared";
import { StepError } from "../management-session/steps/types";
import { validateReceptionInput } from "../purchase/reception";

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
