import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { errorResponse, StepError } from "../../shared";
import { findReception } from "../../../purchase/reception";

// Cancela a sessão. Os registros feitos continuam gravados (para auditoria), mas como a
// sessão nunca será consolidada eles não passam a valer.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  const { id } = await params;

  try {
    await prisma.$transaction(async (tx) => {
      // Recepção com animais recebidos não é cancelada: os animais já existem na
      // fazenda; primeiro é preciso removê-los da recepção (o que desfaz o recebimento).
      if (await findReception(tx, id)) {
        const received = await tx.managementParticipant.count({
          where: { managementSessionId: id },
        });
        if (received) {
          throw new StepError(
            `A recepção tem ${received} animal(is) recebido(s). Remova-os antes de cancelar.`,
            409,
          );
        }
      }

      const now = new Date();
      const cancelled = await tx.managementSession.updateMany({
        where: { id, confirmedAt: null, cancelledAt: null },
        data: { cancelledAt: now },
      });
      if (cancelled.count !== 1) {
        throw new StepError(
          "Somente sessões não consolidadas podem ser canceladas.",
          409,
        );
      }

      await tx.animalBatchTransfer.updateMany({
        where: {
          managementSessionId: id,
          confirmedAt: null,
          cancelledAt: null,
        },
        data: { cancelledAt: now },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
