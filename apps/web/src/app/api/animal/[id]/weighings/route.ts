import { NextRequest, NextResponse } from "next/server";
import { weighingCreateSchema } from "@ifarm/shared";
import { requireSession } from "@/app/api/session";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { listWeighings } from "@ifarm/domain/animal/queries";
import { addWeighing } from "@ifarm/domain/animal/mutations";
import { errorResponse, validationErrorResponse } from "../../../http";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  try {
    const { id } = await params;
    return NextResponse.json(await listWeighings(id));
  } catch (error) {
    return errorResponse(error);
  }
}

// Registra uma pesagem avulsa na hora (o peso atual passa a ser o da mais recente).
export async function POST(request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  try {
    const { id } = await params;
    const validation = weighingCreateSchema.safeParse(
      await request.json().catch(() => ({})),
    );
    if (!validation.success) return validationErrorResponse(validation.error);

    await addWeighing(id, validation.data);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    // Conflito de compromisso aparece só como mensagem, sem campo do formulário.
    return errorResponse(error, { field: null });
  }
}
