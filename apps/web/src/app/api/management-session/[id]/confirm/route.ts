import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { confirmManagementSession } from "@/server/management-session/mutations";
import { errorResponse } from "../../../http";

// Consolida a sessão: os registros passam a valer.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  try {
    const { id } = await params;
    const data = await confirmManagementSession(id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return errorResponse(error);
  }
}
