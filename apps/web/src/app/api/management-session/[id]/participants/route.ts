import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { participantsApiSchema } from "@/server/management-session/schemas";
import {
  invalidAnimals,
  invalidAnimalsMessage,
  requireSessionIn,
  sessionIntent,
  StepError,
} from "@/server/management-session/shared";
import { assertNoConflicts } from "@/server/animal/commitments";
import { findReception } from "@/server/purchase/reception";
import { errorResponse, validationErrorResponse } from "@/app/api/http";

// Inclui na sessão animais que não estavam no planejamento (ex.: apareceram no curral).
// Os que já participam são ignorados.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  const { id } = await params;

  try {
    const validation = participantsApiSchema.safeParse(await request.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    const animalIds = [...new Set(validation.data.animalIds)];

    const added = await prisma.$transaction(async (tx) => {
      const session = await requireSessionIn(
        tx,
        id,
        ["planned", "in_progress"],
        "Somente sessões não consolidadas aceitam novos animais.",
      );

      if (await findReception(tx, id)) {
        throw new StepError(
          "Na recepção de compra os animais são criados pelo recebimento, não incluídos da lista.",
          409,
        );
      }

      const invalid = await invalidAnimals(tx, session.propertyId, animalIds);
      if (invalid.length) {
        throw new StepError(invalidAnimalsMessage(invalid), 400, "animalIds");
      }
      await assertNoConflicts(
        tx,
        animalIds,
        sessionIntent(session.steps, false),
        { sessionId: id },
      );

      const created = await tx.managementParticipant.createMany({
        data: animalIds.map((animalId) => ({
          managementSessionId: id,
          animalId,
        })),
        skipDuplicates: true,
      });
      return created.count;
    });

    return NextResponse.json(
      { success: true, data: { added } },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
