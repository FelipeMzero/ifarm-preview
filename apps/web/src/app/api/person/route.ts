import { NextRequest, NextResponse } from "next/server";
import { personSchema } from "@ifarm/shared";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { listPeople, personQuerySchema } from "@/server/person/queries";
import { createPerson } from "@/server/person/mutations";
import { errorResponse, validationErrorResponse } from "../http";

export async function GET(request: NextRequest) {
  const { response } = await requireSession(RESOURCE_ACCESS.pessoas);
  if (response) return response;

  try {
    const { searchParams } = new URL(request.url);
    const validation = personQuerySchema.safeParse(
      Object.fromEntries(searchParams),
    );
    if (!validation.success) {
      return NextResponse.json(
        { message: "Parâmetros inválidos." },
        { status: 400 },
      );
    }

    return NextResponse.json(await listPeople(validation.data));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const { response } = await requireSession(RESOURCE_ACCESS.pessoas);
  if (response) return response;

  try {
    const validation = personSchema.safeParse(await request.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    const data = await createPerson(validation.data);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
