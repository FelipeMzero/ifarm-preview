import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/app/api/session";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { getAnimalDetails } from "@ifarm/domain/animal/queries";
import { errorResponse } from "../../../http";

// Ficha completa do animal (históricos e compra de origem).
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  try {
    const { id } = await params;
    return NextResponse.json(await getAnimalDetails(id));
  } catch (error) {
    return errorResponse(error);
  }
}
