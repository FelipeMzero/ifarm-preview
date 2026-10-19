import { NextRequest, NextResponse } from "next/server";
import { purchasePaymentSchema } from "@ifarm/shared";
import { requireSession } from "@/app/api/session";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { payPurchase, undoPurchasePayment } from "@/server/purchase/mutations";
import { errorResponse, validationErrorResponse } from "../../../http";

type Params = { params: Promise<{ id: string }> };

// Registra o pagamento (data informada ou hoje).
export async function POST(request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.compras);
  if (response) return response;

  try {
    const { id } = await params;
    const validation = purchasePaymentSchema.safeParse(
      await request.json().catch(() => ({})),
    );
    if (!validation.success) return validationErrorResponse(validation.error);

    await payPurchase(id, validation.data);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

// Desfaz o pagamento (correção de um registro feito por engano).
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.compras);
  if (response) return response;

  try {
    const { id } = await params;
    await undoPurchasePayment(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
