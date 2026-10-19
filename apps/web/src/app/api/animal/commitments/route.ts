import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { findCommitments } from "@/server/animal/commitments";

// Mesmo teto do "adicionar todos os filtrados" do seletor de animais.
const MAX_ANIMALS = 2000;

const bodySchema = z.object({
  animalIds: z.array(z.uuid()).max(MAX_ANIMALS),
  sessionId: z.uuid().optional(),
  transferId: z.uuid().optional(),
});

// Compromissos em aberto de vários animais de uma vez (POST porque a lista não cabe
// numa URL), para o seletor marcar os indisponíveis. `sessionId`/`transferId` é a
// operação sendo editada, que não conta como conflito.
export async function POST(request: NextRequest) {
  // Mesma permissão da listagem de animais que alimenta o seletor.
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  const validation = bodySchema.safeParse(
    await request.json().catch(() => ({})),
  );
  if (!validation.success) {
    return NextResponse.json(
      { message: "Parâmetros inválidos." },
      { status: 400 },
    );
  }

  const { animalIds, ...exclude } = validation.data;

  try {
    const commitments = await prisma.$transaction((tx) =>
      findCommitments(tx, animalIds, exclude),
    );
    return NextResponse.json(Object.fromEntries(commitments));
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Ocorreu um erro interno no servidor." },
      { status: 500 },
    );
  }
}
