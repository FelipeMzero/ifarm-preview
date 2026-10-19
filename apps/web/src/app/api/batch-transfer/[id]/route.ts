import { NextRequest, NextResponse } from "next/server";
import { batchTransferSchema } from "@ifarm/shared";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { getBatchTransfer } from "@/server/batch-transfer/queries";
import { updateBatchTransfer } from "@/server/batch-transfer/mutations";
import { errorResponse, validationErrorResponse } from "../../http";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.lotes);
  if (response) return response;

  try {
    const { id } = await params;
    return NextResponse.json(await getBatchTransfer(id));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.lotes);
  if (response) return response;

  try {
    const { id } = await params;
    const validation = batchTransferSchema.safeParse(await request.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    await updateBatchTransfer(id, validation.data);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
