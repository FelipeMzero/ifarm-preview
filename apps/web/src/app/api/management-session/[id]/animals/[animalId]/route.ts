import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { loadAnimalContext } from "@/server/management-session/animalContext";

// Tudo o que as telas de etapa precisam de um animal da sessão (ver loadAnimalContext).
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; animalId: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  const { id, animalId } = await params;

  try {
    const context = await loadAnimalContext(prisma, id, animalId);
    if (!context) {
      return NextResponse.json(
        { message: "Animal não encontrado nesta sessão de manejo." },
        { status: 404 },
      );
    }
    return NextResponse.json(context);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Ocorreu um erro interno no servidor." },
      { status: 500 },
    );
  }
}
