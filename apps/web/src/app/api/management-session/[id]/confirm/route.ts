import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { consolidateSession } from "../../consolidate";
import { errorResponse } from "../../shared";

// Consolida a sessão (ver consolidateSession).
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  const { id } = await params;

  try {
    const result = await prisma.$transaction(
      (tx) => consolidateSession(tx, id),
      { timeout: 60_000 },
    );
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return errorResponse(error);
  }
}
