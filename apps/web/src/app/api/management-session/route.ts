import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import {
  listManagementSessions,
  managementSessionQuerySchema,
} from "@/server/management-session/queries";
import { createManagementSession } from "@/server/management-session/mutations";
import { managementSessionApiSchema } from "@/server/management-session/schemas";
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
    const validation = managementSessionApiSchema.safeParse(
      await request.json(),
    );
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
