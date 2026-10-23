import { NextRequest, NextResponse } from "next/server";
import { commitmentsLookupSchema } from "@ifarm/shared";
import { requireSession } from "@/app/api/session";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { listCommitments } from "@/server/animal/queries";
import { errorResponse } from "../../http";

// Compromissos em aberto de vários animais de uma vez (POST porque a lista não cabe
// numa URL), para o seletor marcar os indisponíveis.
export async function POST(request: NextRequest) {
  // Mesma permissão da listagem de animais que alimenta o seletor.
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  try {
    const validation = commitmentsLookupSchema.safeParse(
      await request.json().catch(() => ({})),
    );
    if (!validation.success) {
      return NextResponse.json(
        { message: "Parâmetros inválidos." },
        { status: 400 },
      );
    }

    const { animalIds, ...exclude } = validation.data;
    return NextResponse.json(await listCommitments(animalIds, exclude));
  } catch (error) {
    return errorResponse(error);
  }
}
