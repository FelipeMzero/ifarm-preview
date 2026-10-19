import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import {
  applyPlanSteps,
  startOfToday,
  StepError,
} from "@/server/management-session/shared";
import { planStepSchema } from "@/server/management-session/steps";
import { validateReceptionInput } from "@/server/purchase/reception";
import { receptionDocumentsSchema } from "@ifarm/shared";
import { errorResponse, validationErrorResponse } from "@/app/api/http";

const createSchema = receptionDocumentsSchema.extend({
  entryBatchId: z.uuid("Selecione o lote de entrada."),
  // Manejos feitos em cada animal recebido (opcional: receber já pode ser tudo).
  steps: z.array(planStepSchema).default([]),
});

// "Receber animais": abre uma recepção (viagem) da compra. A compra incorpora uma
// sessão de manejo, criada já iniciada com a data de hoje, para receber os animais e
// fazer os manejos de chegada.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS.recepcoes);
  if (response) return response;

  const { id } = await params;

  try {
    const validation = createSchema.safeParse(
      await request.json().catch(() => ({})),
    );
    if (!validation.success) return validationErrorResponse(validation.error);
    const data = validation.data;

    const result = await prisma.$transaction(async (tx) => {
      const event = await tx.purchaseEvent.findUnique({
        where: { id },
        select: {
          destinationPropertyId: true,
          title: true,
          _count: { select: { receptions: true } },
        },
      });
      if (!event) throw new StepError("Compra não encontrada.", 404);

      const propertyId = event.destinationPropertyId;
      await validateReceptionInput(tx, propertyId, {
        purchaseEventId: id,
        entryBatchId: data.entryBatchId,
      });

      const trip = event._count.receptions + 1;
      const today = startOfToday();
      const session = await tx.managementSession.create({
        data: {
          propertyId,
          title: `Recepção ${trip} — ${event.title}`,
          scheduledDate: today,
          managementDate: today,
        },
      });

      await applyPlanSteps(
        tx,
        { ...session, managementDate: today },
        [],
        data.steps,
      );

      const reception = await tx.purchaseReception.create({
        data: {
          purchaseEventId: id,
          managementSessionId: session.id,
          entryBatchId: data.entryBatchId,
          gtaNumber: data.gtaNumber,
          invoiceNumber: data.invoiceNumber,
        },
      });

      return { receptionId: reception.id, sessionId: session.id };
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
