import { NextRequest, NextResponse } from "next/server";
import { purchaseSchema } from "@ifarm/shared";
import { requireSession } from "@/app/api/session";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { getPurchase } from "@ifarm/domain/purchase/queries";
import { updatePurchase } from "@ifarm/domain/purchase/mutations";
import { errorResponse, validationErrorResponse } from "../../http";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.compras);
  if (response) return response;

  try {
    const { id } = await params;
    return NextResponse.json(await getPurchase(id));
  } catch (error) {
    return errorResponse(error);
  }
}

// Altera a negociação enquanto a compra está em andamento.
export async function PUT(request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.compras);
  if (response) return response;

  try {
    const { id } = await params;
    const validation = purchaseSchema.safeParse(await request.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    await updatePurchase(id, validation.data);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
