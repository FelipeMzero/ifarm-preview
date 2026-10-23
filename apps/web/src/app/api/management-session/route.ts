import { NextRequest, NextResponse } from "next/server";
import { managementSessionQuerySchema } from "@ifarm/shared";
import { requireSession } from "@/app/api/session";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { listManagementSessions } from "@/server/management-session/queries";
import { createManagementSession } from "@/server/management-session/mutations";
import { managementSessionSchema } from "@ifarm/shared";
import { errorResponse, validationErrorResponse } from "../http";

export async function GET(request: NextRequest) {
  const { response, session } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  try {
    const { searchParams } = new URL(request.url);
    const query = managementSessionQuerySchema.safeParse(
      Object.fromEntries(searchParams),
    );
    if (!query.success) {
      return NextResponse.json(
        { message: "Parâmetros inválidos." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      await listManagementSessions(query.data, session.user.id),
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const { response, session } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  try {
    const validation = managementSessionSchema.safeParse(await request.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    const data = await createManagementSession(
      validation.data,
      session.user.id,
    );
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
