import { NextRequest, NextResponse } from "next/server";
import { neuteringTechniqueSchema } from "@ifarm/shared";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { listNeuteringTechniques } from "@/server/neutering-technique/queries";
import { createNeuteringTechnique } from "@/server/neutering-technique/mutations";
import { errorResponse, validationErrorResponse } from "../http";

export async function GET() {
  const { response } = await requireSession(
    RESOURCE_ACCESS["tecnicas-castracao"],
  );
  if (response) return response;

  try {
    return NextResponse.json({ data: await listNeuteringTechniques() });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const { response } = await requireSession(
    RESOURCE_ACCESS["tecnicas-castracao"],
  );
  if (response) return response;

  try {
    const validation = neuteringTechniqueSchema.safeParse(await request.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    const data = await createNeuteringTechnique(validation.data);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
