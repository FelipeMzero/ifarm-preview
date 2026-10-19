import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { cancelManagementSession } from "@/server/management-session/mutations";
import { errorResponse } from "../../../http";

// Cancela a sessão (os registros ficam gravados, mas não passam a valer).
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  try {
    const { id } = await params;
    await cancelManagementSession(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
