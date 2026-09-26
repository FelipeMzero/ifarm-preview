import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { toNeuteringDto } from "../../neuterings";
import { effectiveNeutering } from "../../../management-session/effective";

// Castrações válidas (não canceladas), da mais recente para a mais antiga.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  const { id } = await params;

  try {
    const items = await prisma.animalNeutering.findMany({
      where: { animalId: id, cancelledAt: null, ...effectiveNeutering },
    });

    return NextResponse.json(
      items
        .map(toNeuteringDto)
        .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id),
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Ocorreu um erro interno no servidor." },
      { status: 500 },
    );
  }
}
