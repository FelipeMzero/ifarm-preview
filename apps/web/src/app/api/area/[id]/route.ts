import { NextRequest, NextResponse } from "next/server";
import { areaSchema } from "@ifarm/shared";
import { requireSession } from "@/app/api/session";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { getArea } from "@/server/area/queries";
import {
  deleteArea,
  toggleAreaStatus,
  updateArea,
} from "@/server/area/mutations";
import { errorResponse, validationErrorResponse } from "../../http";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.areas);
  if (response) return response;

  try {
    const { id } = await params;
    return NextResponse.json(await getArea(id));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.areas);
  if (response) return response;

  try {
    const { id } = await params;
    const validation = areaSchema.safeParse(await request.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    const data = await updateArea(id, validation.data);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.areas);
  if (response) return response;

  try {
    const { id } = await params;
    await deleteArea(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

// Ativa ou desativa a área (recusa desativar área ocupada por lote).
export async function PATCH(_request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.areas);
  if (response) return response;

  try {
    const { id } = await params;
    const data = await toggleAreaStatus(id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return errorResponse(error);
  }
}
