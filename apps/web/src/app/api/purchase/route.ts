import { NextRequest, NextResponse } from "next/server";
import { purchaseQuerySchema } from "@ifarm/shared";
import { purchaseSchema } from "@ifarm/shared";
import { requireSession } from "@/app/api/session";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { listPurchases } from "@ifarm/domain/purchase/queries";
import { createPurchase } from "@ifarm/domain/purchase/mutations";
import { errorResponse, validationErrorResponse } from "../http";

export async function GET(request: NextRequest) {
  const { response, session } = await requireSession(RESOURCE_ACCESS.compras);
  if (response) return response;

  try {
    const { searchParams } = new URL(request.url);
    const query = purchaseQuerySchema.safeParse(
      Object.fromEntries(searchParams),
    );
    if (!query.success) {
      return NextResponse.json(
        { message: "Parâmetros inválidos." },
        { status: 400 },
      );
    }

    return NextResponse.json(await listPurchases(query.data, session.user.id));
  } catch (error) {
    return errorResponse(error);
  }
}

// Registra a negociação (sem animais; eles são criados nas recepções).
export async function POST(request: NextRequest) {
  const { response, session } = await requireSession(RESOURCE_ACCESS.compras);
  if (response) return response;

  try {
    const validation = purchaseSchema.safeParse(await request.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    const data = await createPurchase(validation.data, session.user.id);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
