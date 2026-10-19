import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { loadAnimalContext } from "@/server/management-session/animalContext";
import {
  clearAnimalStep,
  saveAnimalStep,
} from "@/server/management-session/records";
import { errorResponse, validationErrorResponse } from "@/app/api/http";

type Params = {
  params: Promise<{ id: string; animalId: string; key: string }>;
};

// Registra (ou corrige) uma etapa do manejo no animal. Devolve o contexto atualizado do
// animal (ver loadAnimalContext), para a tela seguir sem outra requisição.
export async function PUT(request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  const { id, animalId, key } = await params;

  try {
    const body = await request.json();
    await prisma.$transaction((tx) =>
      saveAnimalStep(tx, id, animalId, decodeURIComponent(key), body),
    );
    const data = await loadAnimalContext(prisma, id, animalId);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof ZodError) return validationErrorResponse(error);
    return errorResponse(error);
  }
}

// Desfaz o registro da etapa no animal. Devolve o contexto atualizado, como o PUT.
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  const { id, animalId, key } = await params;

  try {
    await prisma.$transaction((tx) =>
      clearAnimalStep(tx, id, animalId, decodeURIComponent(key)),
    );
    const data = await loadAnimalContext(prisma, id, animalId);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return errorResponse(error);
  }
}
