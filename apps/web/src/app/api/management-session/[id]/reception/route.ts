import { NextRequest, NextResponse } from "next/server";
import { receptionDocumentsSchema } from "@ifarm/shared";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { updateReceptionDocuments } from "@/server/management-session/mutations";
import { errorResponse, validationErrorResponse } from "../../../http";

// Documentos da carga (GTA e nota fiscal) de uma recepção em aberto.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS.recepcoes);
  if (response) return response;

  try {
    const { id } = await params;
    const validation = receptionDocumentsSchema.safeParse(
      await request.json().catch(() => ({})),
    );
    if (!validation.success) return validationErrorResponse(validation.error);

    await updateReceptionDocuments(id, validation.data);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
