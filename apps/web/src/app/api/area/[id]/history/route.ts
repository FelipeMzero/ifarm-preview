import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/app/api/session";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { getAreaOccupancyHistory } from "@/server/area/queries";
import { errorResponse } from "../../../http";

// Lotes que ocuparam a área, do mais recente para o mais antigo.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS.areas);
  if (response) return response;

  try {
    const { id } = await params;
    return NextResponse.json({ data: await getAreaOccupancyHistory(id) });
  } catch (error) {
    return errorResponse(error);
  }
}
