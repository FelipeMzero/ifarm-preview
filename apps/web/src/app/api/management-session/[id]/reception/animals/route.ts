import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/app/api/session";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { receiveSessionAnimal } from "@/server/management-session/mutations";
import { receiveAnimalSchema } from "@ifarm/shared";
import { errorResponse, validationErrorResponse } from "../../../../http";

// Recebe um animal que desceu do caminhão (cria o animal e o inclui na sessão).
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  try {
    const { id } = await params;
    const validation = receiveAnimalSchema.safeParse(
      await request.json().catch(() => ({})),
    );
    if (!validation.success) return validationErrorResponse(validation.error);

    const data = await receiveSessionAnimal(id, validation.data);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
