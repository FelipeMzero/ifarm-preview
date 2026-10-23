import { NextRequest, NextResponse } from "next/server";
import { batchTransferQuerySchema } from "@ifarm/shared";
import { batchTransferSchema } from "@ifarm/shared";
import { requireSession } from "@/app/api/session";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { listBatchTransfers } from "@/server/batch-transfer/queries";
import { createBatchTransfer } from "@/server/batch-transfer/mutations";
import { errorResponse, validationErrorResponse } from "../http";

export async function GET(request: NextRequest) {
  const { response, session } = await requireSession(RESOURCE_ACCESS.lotes);
  if (response) return response;

  try {
    const { searchParams } = new URL(request.url);
    const query = batchTransferQuerySchema.safeParse(
      Object.fromEntries(searchParams),
    );
    if (!query.success) {
      return NextResponse.json(
        { message: "Parâmetros inválidos." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      await listBatchTransfers(query.data, session.user.id),
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const { response, session } = await requireSession(RESOURCE_ACCESS.lotes);
  if (response) return response;

  try {
    const validation = batchTransferSchema.safeParse(await request.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    const data = await createBatchTransfer(validation.data, session.user.id);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
