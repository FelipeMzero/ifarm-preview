import { NextRequest, NextResponse } from "next/server";
import { healthManagementTypeSchema } from "@ifarm/shared";
import { requireSession } from "@/app/api/session";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { listHealthManagementTypes } from "@/server/health-management-type/queries";
import { createHealthManagementType } from "@/server/health-management-type/mutations";
import { errorResponse, validationErrorResponse } from "../http";

export async function GET() {
  const { response } = await requireSession(
    RESOURCE_ACCESS["tipos-sanitarios"],
  );
  if (response) return response;

  try {
    return NextResponse.json({ data: await listHealthManagementTypes() });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const { response } = await requireSession(
    RESOURCE_ACCESS["tipos-sanitarios"],
  );
  if (response) return response;

  try {
    const validation = healthManagementTypeSchema.safeParse(
      await request.json(),
    );
    if (!validation.success) return validationErrorResponse(validation.error);

    const data = await createHealthManagementType(validation.data);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
