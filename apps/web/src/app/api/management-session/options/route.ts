import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { getManagementOptions } from "@/server/management-session/queries";
import { errorResponse } from "../../http";

// Opções do planejamento e do registro (tipos sanitários, técnicas, pessoas, lotes).
export async function GET(request: NextRequest) {
  const { response, session } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  try {
    return NextResponse.json(
      await getManagementOptions(
        request.nextUrl.searchParams.get("propertyId"),
        session.user.id,
      ),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
