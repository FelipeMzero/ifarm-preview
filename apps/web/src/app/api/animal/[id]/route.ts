import { NextRequest, NextResponse } from "next/server";
import { animalUpdateSchema } from "@ifarm/shared";
import { requireSession } from "@/app/api/session";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { getAnimal } from "@ifarm/domain/animal/queries";
import { deleteAnimal, updateAnimal } from "@ifarm/domain/animal/mutations";
import { errorResponse, validationErrorResponse } from "../../http";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  try {
    const { id } = await params;
    return NextResponse.json(await getAnimal(id));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  try {
    const { id } = await params;
    const validation = animalUpdateSchema.safeParse(await request.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    await updateAnimal(id, validation.data);
    return NextResponse.json({ success: true });
  } catch (error) {
    // Conflito de compromisso aparece só como mensagem, sem campo do formulário.
    return errorResponse(error, { field: null });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  try {
    const { id } = await params;
    await deleteAnimal(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
