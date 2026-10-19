import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import {
  clearSessionAnimalStep,
  saveSessionAnimalStep,
} from "@/server/management-session/mutations";
import { errorResponse } from "../../../../../../http";

type Params = {
  params: Promise<{ id: string; animalId: string; key: string }>;
};

// Registra (ou corrige) uma etapa do manejo no animal e devolve o contexto atualizado.
// Os dados são validados pelo módulo da etapa.
export async function PUT(request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  try {
    const { id, animalId, key } = await params;
    const data = await saveSessionAnimalStep(
      id,
      animalId,
      decodeURIComponent(key),
      await request.json(),
    );
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return errorResponse(error);
  }
}

// Desfaz o registro da etapa no animal e devolve o contexto atualizado.
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  try {
    const { id, animalId, key } = await params;
    const data = await clearSessionAnimalStep(
      id,
      animalId,
      decodeURIComponent(key),
    );
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return errorResponse(error);
  }
}
