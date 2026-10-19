import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/app/api/session";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { removeParticipant } from "@/server/management-session/mutations";
import { errorResponse } from "../../../../http";

// Tira o animal da sessão, desfazendo os registros que ele já tinha.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; animalId: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  try {
    const { id, animalId } = await params;
    await removeParticipant(id, animalId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
