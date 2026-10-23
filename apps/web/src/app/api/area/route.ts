import { NextRequest, NextResponse } from "next/server";
import { areaQuerySchema } from "@ifarm/shared";
import { areaSchema } from "@ifarm/shared";
import { requireSession } from "@/app/api/session";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { listAreas } from "@/server/area/queries";
import { createArea } from "@/server/area/mutations";
import { errorResponse, validationErrorResponse } from "../http";

export async function GET(request: NextRequest) {
  const { session, response } = await requireSession(RESOURCE_ACCESS.areas);
  if (response) return response;

  try {
    const { searchParams } = new URL(request.url);
    const validation = areaQuerySchema.safeParse(
      Object.fromEntries(searchParams),
    );
    if (!validation.success) return validationErrorResponse(validation.error);

    const data = await listAreas(validation.data, session.user.id);
    return NextResponse.json({ data });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const { response } = await requireSession(RESOURCE_ACCESS.areas);
  if (response) return response;

  try {
    const validation = areaSchema.safeParse(await request.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    const data = await createArea(validation.data);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
