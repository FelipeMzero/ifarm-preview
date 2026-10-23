import { NextRequest, NextResponse } from "next/server";
import { propertyQuerySchema } from "@ifarm/shared";
import { propertySchema } from "@ifarm/shared";
import { requireSession } from "@/app/api/session";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { listProperties } from "@/server/property/queries";
import { createProperty } from "@/server/property/mutations";
import { errorResponse, validationErrorResponse } from "../http";

export async function GET(request: NextRequest) {
  const { response } = await requireSession(RESOURCE_ACCESS.propriedades);
  if (response) return response;

  try {
    const { searchParams } = new URL(request.url);
    const validation = propertyQuerySchema.safeParse(
      Object.fromEntries(searchParams),
    );
    if (!validation.success) {
      return NextResponse.json(
        { message: "Parâmetros inválidos." },
        { status: 400 },
      );
    }

    return NextResponse.json(await listProperties(validation.data));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const { response } = await requireSession(RESOURCE_ACCESS.propriedades);
  if (response) return response;

  try {
    const validation = propertySchema.safeParse(await request.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    const data = await createProperty(validation.data);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
