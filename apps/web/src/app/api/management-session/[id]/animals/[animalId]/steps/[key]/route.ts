import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import {
  errorResponse,
  findStep,
  requireManagementDate,
  requireSessionIn,
  StepError,
  validationErrors,
  type LoadedSession,
} from "../../../../../shared";
import { countDone, loadStepRecords, stepModule } from "../../../../../steps";
import type { Tx } from "../../../../../steps/types";

type Params = {
  params: Promise<{ id: string; animalId: string; key: string }>;
};

async function requireParticipant(tx: Tx, sessionId: string, animalId: string) {
  const participant = await tx.managementParticipant.findUnique({
    where: {
      managementSessionId_animalId: {
        managementSessionId: sessionId,
        animalId,
      },
    },
  });
  if (!participant) {
    throw new StepError("O animal não participa desta sessão.", 404);
  }
  return participant;
}

// Mantém lastHandledAt coerente: sem registros, o animal volta para "a manejar".
async function touchParticipant(
  tx: Tx,
  session: LoadedSession,
  participantId: number,
  animalId: string,
) {
  const records = await loadStepRecords(tx, session, session.steps, [animalId]);
  await tx.managementParticipant.update({
    where: { id: participantId },
    data: { lastHandledAt: countDone(records, animalId) ? new Date() : null },
  });
}

// Registra (ou corrige) uma etapa do manejo no animal.
export async function PUT(request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  const { id, animalId, key } = await params;

  try {
    const body = await request.json();

    await prisma.$transaction(async (tx) => {
      const session = requireManagementDate(
        await requireSessionIn(
          tx,
          id,
          ["in_progress"],
          "Somente sessões em andamento aceitam registros.",
        ),
      );
      const step = findStep(session.steps, decodeURIComponent(key));
      const participant = await requireParticipant(tx, id, animalId);

      const handler = stepModule(step.type);
      const validation = handler.payloadSchema.safeParse(body);
      if (!validation.success) throw validation.error;

      const animal = await tx.animal.findUniqueOrThrow({
        where: { id: animalId },
        select: {
          id: true,
          code: true,
          sex: true,
          neutered: true,
          currentTag: true,
          currentRfid: true,
          currentBatchId: true,
        },
      });

      await handler.save(tx, session, step, animal, validation.data);
      await touchParticipant(tx, session, participant.id, animalId);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ZodError) return validationErrors(error);
    return errorResponse(error);
  }
}

// Desfaz o registro da etapa no animal.
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  const { id, animalId, key } = await params;

  try {
    await prisma.$transaction(async (tx) => {
      const session = await requireSessionIn(
        tx,
        id,
        ["in_progress"],
        "Somente sessões em andamento podem ser alteradas.",
      );
      const step = findStep(session.steps, decodeURIComponent(key));
      const participant = await requireParticipant(tx, id, animalId);

      await stepModule(step.type).clear(tx, session, step, animalId);
      await touchParticipant(tx, session, participant.id, animalId);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
