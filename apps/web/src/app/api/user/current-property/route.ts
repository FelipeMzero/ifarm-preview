import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { getOrAssignCurrentProperty } from "@/server/current-property/queries";
import { setCurrentProperty } from "@/server/current-property/mutations";
import { errorResponse } from "../../http";

const bodySchema = z.object({
  propertyId: z.string().min(1, "Este campo não pode ser vazio"),
});

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
    const validation = bodySchema.safeParse(await request.json());
    if (!validation.success) {
      return NextResponse.json(
        { message: "Parâmetros inválidos." },
        { status: 400 },
      );
    }

    const data = await setCurrentProperty(
      session.user.id,
      validation.data.propertyId,
    );
    return NextResponse.json({ data });
  } catch (error) {
    return errorResponse(error);
  }
}
