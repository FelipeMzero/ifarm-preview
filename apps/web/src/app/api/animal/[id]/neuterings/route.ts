import { NextRequest, NextResponse } from "next/server";
import { neuteringCreateSchema } from "@ifarm/shared";
import { requireSession } from "@/app/api/session";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { listNeuterings } from "@ifarm/domain/animal/queries";
import { addNeutering } from "@ifarm/domain/animal/mutations";
import { errorResponse, validationErrorResponse } from "../../../http";

type Params = { params: Promise<{ id: string }> };

// Castrações válidas (não canceladas), da mais recente para a mais antiga.
export async function GET(_request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  try {
    const { id } = await params;
    return NextResponse.json(await listNeuterings(id));
  } catch (error) {
    return errorResponse(error);
  }
}

// Registra uma castração avulsa na hora (recastração exige o motivo).
export async function POST(request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  try {
    const { id } = await params;
    const validation = neuteringCreateSchema.safeParse(
      await request.json().catch(() => ({})),
    );
    if (!validation.success) return validationErrorResponse(validation.error);

    await addNeutering(id, validation.data);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    // Conflito de compromisso aparece só como mensagem, sem campo do formulário.
    return errorResponse(error, { field: null });
  }
}
