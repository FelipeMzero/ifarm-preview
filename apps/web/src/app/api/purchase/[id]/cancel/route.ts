import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/app/api/session";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { cancelPurchase } from "@ifarm/domain/purchase/mutations";
import { errorResponse } from "../../../http";

// Cancela (desconsidera) uma compra em andamento, sem animais recebidos e não paga.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS.compras);
  if (response) return response;

  try {
    const { id } = await params;
    await cancelPurchase(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
