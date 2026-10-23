import { NextRequest, NextResponse } from "next/server";
import { currentPropertySchema } from "@ifarm/shared";
import { requireSession } from "@/app/api/session";
import { getOrAssignCurrentProperty } from "@ifarm/domain/current-property/queries";
import { setCurrentProperty } from "@ifarm/domain/current-property/mutations";
import { errorResponse, validationErrorResponse } from "../../http";

// Retorna a propriedade atualmente selecionada pelo usuário logado. Se ele ainda não
// tiver escolhido nenhuma, assume automaticamente a mais antiga cadastrada (ou `null`
// se não houver nenhuma propriedade no sistema).
export async function GET() {
  const { session, response } = await requireSession();
  if (response) return response;

  try {
    const data = await getOrAssignCurrentProperty(session.user.id);
    return NextResponse.json({ data });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: NextRequest) {
  const { session, response } = await requireSession();
  if (response) return response;

  try {
    const validation = currentPropertySchema.safeParse(await request.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    const data = await setCurrentProperty(
      session.user.id,
      validation.data.propertyId,
    );
    return NextResponse.json({ data });
  } catch (error) {
    return errorResponse(error);
  }
}
