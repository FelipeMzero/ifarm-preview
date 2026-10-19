import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { managementSessionStartApiSchema } from "@/server/management-session/schemas";
import {
  requireSessionIn,
  startOfToday,
  StepError,
} from "@/server/management-session/shared";
import { errorResponse, validationErrorResponse } from "@/app/api/http";

// Inicia o registro informando a data em que o manejo acontece. Também serve para
// corrigir essa data enquanto a sessão não for consolidada: os registros recebem a
// data definitiva na consolidação.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  const { id } = await params;

  try {
    const validation = managementSessionStartApiSchema.safeParse(
      await request.json(),
    );
    if (!validation.success) return validationErrorResponse(validation.error);

    const { managementDate } = validation.data;
    if (managementDate > startOfToday()) {
      throw new StepError(
        "A data do manejo não pode ser futura.",
        400,
        "managementDate",
      );
    }

    await prisma.$transaction(async (tx) => {
      await requireSessionIn(
        tx,
        id,
        ["planned", "in_progress"],
        "Somente sessões não consolidadas podem ser iniciadas.",
      );
      await tx.managementSession.update({
        where: { id },
        data: { managementDate },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
