import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import {
  assertNoConflicts,
  CommitmentError,
  commitmentErrorResponse,
} from "../../commitments";
import { neuteringCreateApiSchema } from "../../../schemas";
import { resolveEventDate } from "../../eventDate";
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

// Registra uma castração avulsa na hora. Se o animal já é castrado, é uma recastração
// (não é rotineira): o motivo é obrigatório.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  const { id } = await params;

  try {
    const validation = neuteringCreateApiSchema.safeParse(
      await request.json().catch(() => ({})),
    );
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (field && !errors[field]) errors[field] = issue.message;
      });
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    const data = validation.data;
    const animal = await prisma.animal.findUnique({
      where: { id },
      select: { neutered: true },
    });
    if (!animal) {
      return NextResponse.json(
        { success: false, message: "Animal não encontrado." },
        { status: 404 },
      );
    }
    if (animal.neutered && !data.notes) {
      return NextResponse.json(
        {
          success: false,
          errors: { notes: "Informe o motivo da recastração." },
        },
        { status: 400 },
      );
    }

    const date = await resolveEventDate(id, data.date);
    if (!date.ok) {
      return NextResponse.json(
        { success: false, errors: { date: date.error } },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await assertNoConflicts(tx, [id], { kind: "record", type: "neutering" });
      await tx.animalNeutering.create({
        data: {
          animalId: id,
          neuteredAt: date.at,
          method: data.method,
          notes: data.notes,
        },
      });
      await tx.animal.update({ where: { id }, data: { neutered: true } });
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    if (error instanceof CommitmentError) {
      return commitmentErrorResponse(error, null);
    }
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Ocorreu um erro interno no servidor." },
      { status: 500 },
    );
  }
}
