import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import {
  requireSessionIn,
  StepError,
} from "@/server/management-session/shared";
import { stepModule } from "@/server/management-session/steps";
import {
  findReception,
  removeReceivedAnimal,
} from "@/server/purchase/reception";
import { errorResponse } from "@/app/api/http";

// Tira o animal da sessão, desfazendo os registros que ele já tinha. Numa recepção de
// compra, o animal recebido é apagado.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; animalId: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  const { id, animalId } = await params;

  try {
    await prisma.$transaction(async (tx) => {
      const session = await requireSessionIn(
        tx,
        id,
        ["planned", "in_progress"],
        "Somente sessões não consolidadas podem ser alteradas.",
      );

      for (const step of session.steps) {
        await stepModule(step.type).clear(tx, session, step, animalId);
      }

      const removed = await tx.managementParticipant.deleteMany({
        where: { managementSessionId: id, animalId },
      });
      if (removed.count !== 1) {
        throw new StepError("O animal não participa desta sessão.", 404);
      }

      // Na recepção o animal foi criado aqui: sair da sessão desfaz o recebimento.
      const reception = await findReception(tx, id);
      if (reception) await removeReceivedAnimal(tx, reception, animalId);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
