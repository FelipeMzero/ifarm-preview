import { NextRequest, NextResponse } from "next/server";
import { personSchema } from "@ifarm/shared";
import { requireSession } from "@/app/api/session";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { getPerson } from "@/server/person/queries";
import {
  deletePerson,
  togglePersonStatus,
  updatePerson,
} from "@/server/person/mutations";
import { errorResponse, validationErrorResponse } from "../../http";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.pessoas);
  if (response) return response;

  try {
    const { id } = await params;
    return NextResponse.json(await getPerson(id));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.pessoas);
  if (response) return response;

  try {
    const { id } = await params;
    const validation = personSchema.safeParse(await request.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    const data = await updatePerson(id, validation.data);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.pessoas);
  if (response) return response;

  try {
    const { id } = await params;
    await deletePerson(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

// Ativa ou desativa a pessoa.
export async function PATCH(_request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.pessoas);
  if (response) return response;

  try {
    const { id } = await params;
    const data = await togglePersonStatus(id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return errorResponse(error);
  }
}
