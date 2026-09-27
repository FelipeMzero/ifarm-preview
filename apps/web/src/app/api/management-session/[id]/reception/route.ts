import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import {
  errorResponse,
  requireSessionIn,
  StepError,
  validationErrors,
} from "../../shared";
import { receptionDocumentsSchema } from "../../../purchase/schemas";

// Documentos da carga (GTA e nota fiscal) de uma recepção em aberto.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS.recepcoes);
  if (response) return response;

  const { id } = await params;

  try {
    const validation = receptionDocumentsSchema.safeParse(
      await request.json().catch(() => ({})),
    );
    if (!validation.success) return validationErrors(validation.error);

    await prisma.$transaction(async (tx) => {
      await requireSessionIn(
        tx,
        id,
        ["planned", "in_progress"],
        "A recepção já foi concluída ou cancelada.",
      );
      const updated = await tx.purchaseReception.updateMany({
        where: { managementSessionId: id },
        data: validation.data,
      });
      if (updated.count !== 1) {
        throw new StepError("Esta sessão não é uma recepção de compra.", 400);
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
