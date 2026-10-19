import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/app/api/session";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { startManagementSession } from "@/server/management-session/mutations";
import { managementSessionStartApiSchema } from "@/server/management-session/schemas";
import { errorResponse, validationErrorResponse } from "../../../http";

// Inicia o registro (ou corrige a data do manejo enquanto não consolidada).
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  try {
    const { id } = await params;
    const validation = managementSessionStartApiSchema.safeParse(
      await request.json(),
    );
    if (!validation.success) return validationErrorResponse(validation.error);

    await startManagementSession(id, validation.data);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
