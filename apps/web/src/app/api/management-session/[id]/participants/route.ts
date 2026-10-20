import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/app/api/session";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { addParticipants } from "@/server/management-session/mutations";
import { sessionParticipantsSchema } from "@ifarm/shared";
import { errorResponse, validationErrorResponse } from "../../../http";

// Inclui na sessão animais que não estavam no planejamento.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  try {
    const { id } = await params;
    const validation = sessionParticipantsSchema.safeParse(
      await request.json(),
    );
    if (!validation.success) return validationErrorResponse(validation.error);

    const data = await addParticipants(id, validation.data.animalIds);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
