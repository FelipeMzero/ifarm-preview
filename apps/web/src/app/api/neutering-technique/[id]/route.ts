import { NextRequest, NextResponse } from "next/server";
import { neuteringTechniqueSchema } from "@ifarm/shared";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import {
  deleteNeuteringTechnique,
  toggleNeuteringTechniqueStatus,
  updateNeuteringTechnique,
} from "@/server/neutering-technique/mutations";
import { errorResponse, validationErrorResponse } from "../../http";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const { response } = await requireSession(
    RESOURCE_ACCESS["tecnicas-castracao"],
  );
  if (response) return response;

  try {
    const { id } = await params;
    const validation = neuteringTechniqueSchema.safeParse(await request.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    const data = await updateNeuteringTechnique(id, validation.data);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { response } = await requireSession(
    RESOURCE_ACCESS["tecnicas-castracao"],
  );
  if (response) return response;

  try {
    const { id } = await params;
    await deleteNeuteringTechnique(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

// Ativa ou desativa a técnica de castração.
export async function PATCH(_request: NextRequest, { params }: Params) {
  const { response } = await requireSession(
    RESOURCE_ACCESS["tecnicas-castracao"],
  );
  if (response) return response;

  try {
    const { id } = await params;
    const data = await toggleNeuteringTechniqueStatus(id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return errorResponse(error);
  }
}
