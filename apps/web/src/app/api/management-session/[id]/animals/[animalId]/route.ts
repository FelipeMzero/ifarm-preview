import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/app/api/session";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { getSessionAnimal } from "@ifarm/domain/management-session/queries";
import { errorResponse } from "../../../../http";

// Tudo o que as telas de etapa precisam de um animal da sessão.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; animalId: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  try {
    const { id, animalId } = await params;
    return NextResponse.json(await getSessionAnimal(id, animalId));
  } catch (error) {
    return errorResponse(error);
  }
}
