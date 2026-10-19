import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import {
  listReceptionPurchases,
  receptionPurchaseQuerySchema,
} from "@/server/reception/queries";
import { errorResponse } from "../../http";

// Compras da propriedade vistas pela área de recepções (sem valores).
export async function GET(request: NextRequest) {
  const { response, session } = await requireSession(RESOURCE_ACCESS.recepcoes);
  if (response) return response;

  try {
    const query = receptionPurchaseQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    if (!query.success) {
      return NextResponse.json(
        { message: "Parâmetros inválidos." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      await listReceptionPurchases(query.data, session.user.id),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
