import { NextRequest, NextResponse } from "next/server";
import { batchReopenSchema } from "@ifarm/shared";
import { requireSession } from "@/app/api/session";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { reopenBatch } from "@/server/batch/mutations";
import { errorResponse, validationErrorResponse } from "../../../http";

// Reativa um lote encerrado numa área livre.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS.lotes);
  if (response) return response;

  try {
    const { id } = await params;
    const validation = batchReopenSchema.safeParse(await request.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    await reopenBatch(id, validation.data);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
