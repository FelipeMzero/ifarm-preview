import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { findCommitments } from "@/server/animal/commitments";

// Operações abertas que já contam com o animal, para as telas avisarem antes de
// salvar (as regras de conflito ficam em lib/animal-commitments.ts).
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  const { id } = await params;

  try {
    const commitments = await prisma.$transaction((tx) =>
      findCommitments(tx, [id]),
    );
    return NextResponse.json(commitments.get(id) ?? []);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Ocorreu um erro interno no servidor." },
      { status: 500 },
    );
  }
}
