import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import {
  requireManagementDate,
  requireSessionIn,
  StepError,
} from "@/server/management-session/shared";
import {
  findReception,
  receiveAnimal,
  receiveAnimalSchema,
} from "@/server/purchase/reception";
import { errorResponse, validationErrorResponse } from "@/app/api/http";

// Recebe um animal que desceu do caminhão: cria o animal (ativo, no lote de entrada),
// liga-o à categoria da compra e o inclui na sessão para os manejos da recepção.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  const { id } = await params;

  try {
    const validation = receiveAnimalSchema.safeParse(
      await request.json().catch(() => ({})),
    );
    if (!validation.success) return validationErrorResponse(validation.error);

    const animalId = await prisma.$transaction(async (tx) => {
      const session = requireManagementDate(
        await requireSessionIn(
          tx,
          id,
          ["in_progress"],
          "Inicie a recepção para receber animais.",
        ),
      );
      const reception = await findReception(tx, id);
      if (!reception) {
        throw new StepError("Esta sessão não é uma recepção de compra.", 400);
      }
      return receiveAnimal(tx, session, reception, validation.data);
    });

    return NextResponse.json(
      { success: true, data: { animalId } },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ZodError) return validationErrorResponse(error);
    return errorResponse(error);
  }
}
