import { NextRequest, NextResponse } from "next/server";
import { batchUpdateSchema } from "@ifarm/shared";
import { requireSession } from "@/app/api/session";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { getBatch } from "@/server/batch/queries";
import { deleteBatch, updateBatch } from "@/server/batch/mutations";
import { errorResponse, validationErrorResponse } from "../../http";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.lotes);
  if (response) return response;

  try {
    const { id } = await params;
    return NextResponse.json(await getBatch(id));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.lotes);
  if (response) return response;

  try {
    const { id } = await params;
    const validation = batchUpdateSchema.safeParse(await request.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    await updateBatch(id, validation.data);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.lotes);
  if (response) return response;

  try {
    const { id } = await params;
    await deleteBatch(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
