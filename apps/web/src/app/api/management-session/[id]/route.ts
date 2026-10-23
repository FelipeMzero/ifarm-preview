import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/app/api/session";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { getManagementSession } from "@ifarm/domain/management-session/queries";
import { updateManagementSession } from "@ifarm/domain/management-session/mutations";
import { managementSessionSchema } from "@ifarm/shared";
import { errorResponse, validationErrorResponse } from "../../http";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  try {
    const { id } = await params;
    return NextResponse.json(await getManagementSession(id));
  } catch (error) {
    return errorResponse(error);
  }
}

// Altera o planejamento enquanto a sessão não for consolidada ou cancelada.
export async function PUT(request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  try {
    const { id } = await params;
    const validation = managementSessionSchema.safeParse(await request.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    await updateManagementSession(id, validation.data);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
