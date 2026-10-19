import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/app/api/session";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { getAnimalCommitments } from "@/server/animal/queries";
import { errorResponse } from "../../../http";

// Operações abertas que já contam com o animal, para as telas avisarem antes de salvar.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  try {
    const { id } = await params;
    return NextResponse.json(await getAnimalCommitments(id));
  } catch (error) {
    return errorResponse(error);
  }
}
