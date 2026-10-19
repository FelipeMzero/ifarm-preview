import { NextRequest, NextResponse } from "next/server";
import {
  neuteringCancelSchema,
  neuteringCorrectionSchema,
} from "@ifarm/shared";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { cancelNeutering, correctNeutering } from "@/server/animal/mutations";
import { errorResponse, validationErrorResponse } from "../../../../http";

type Params = { params: Promise<{ id: string; neuteringId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  try {
    const { id, neuteringId } = await params;
    const validation = neuteringCorrectionSchema.safeParse(
      await request.json(),
    );
    if (!validation.success) return validationErrorResponse(validation.error);

    await correctNeutering(id, neuteringId, validation.data);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  try {
    const { id, neuteringId } = await params;
    const validation = neuteringCancelSchema.safeParse(
      await request.json().catch(() => ({})),
    );
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: "Parâmetros inválidos." },
        { status: 400 },
      );
    }

    await cancelNeutering(id, neuteringId, validation.data);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
