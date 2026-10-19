import { NextRequest, NextResponse } from "next/server";
import { weighingCorrectionSchema } from "@ifarm/shared";
import { requireSession } from "@/app/api/session";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { cancelWeighing, correctWeighing } from "@/server/animal/mutations";
import { errorResponse, validationErrorResponse } from "../../../../http";

type Params = { params: Promise<{ id: string; weighingId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  try {
    const { id, weighingId } = await params;
    const validation = weighingCorrectionSchema.safeParse(await request.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    await correctWeighing(id, weighingId, validation.data);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  try {
    const { id, weighingId } = await params;
    await cancelWeighing(id, weighingId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
