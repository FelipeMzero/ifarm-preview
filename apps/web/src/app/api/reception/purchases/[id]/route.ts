import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/app/api/session";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { getReceptionPurchase } from "@/server/reception/queries";
import { errorResponse } from "../../../http";

// Uma compra vista pela área de recepções (sem valores).
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS.recepcoes);
  if (response) return response;

  try {
    const { id } = await params;
    return NextResponse.json(await getReceptionPurchase(id));
  } catch (error) {
    return errorResponse(error);
  }
}
