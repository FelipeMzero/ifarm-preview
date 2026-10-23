import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/app/api/session";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { getBatchDetails } from "@ifarm/domain/batch/queries";
import { errorResponse } from "../../../http";

// Painel do lote (animais, indicadores, movimentações, transferências e compras).
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS.lotes);
  if (response) return response;

  try {
    const { id } = await params;
    return NextResponse.json(await getBatchDetails(id));
  } catch (error) {
    return errorResponse(error);
  }
}
