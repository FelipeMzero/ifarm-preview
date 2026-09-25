import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { weighingCorrectionApiSchema } from "../../../../schemas";
import { recomputeCurrentWeight } from "../../../weighings";

type Params = { params: Promise<{ id: string; weighingId: string }> };

async function findActiveWeighing(animalId: string, weighingId: string) {
  const numericId = Number(weighingId);
  if (!Number.isInteger(numericId)) return null;

  return prisma.weighingManagementItem.findFirst({
    where: { id: numericId, animalId, cancelledAt: null },
  });
}

const notFound = () =>
  NextResponse.json(
    { success: false, message: "Pesagem não encontrada." },
    { status: 404 },
  );

export async function PATCH(request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  const { id, weighingId } = await params;

  try {
    const body = await request.json();
    const validation = weighingCorrectionApiSchema.safeParse(body);

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (field && !errors[field]) errors[field] = issue.message;
      });
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    const data = validation.data;
    const weighing = await findActiveWeighing(id, weighingId);
    if (!weighing) return notFound();

    if (data.date && weighing.managementId) {
      return NextResponse.json(
        {
          success: false,
          errors: {
            date: "A data de uma pesagem feita em sessão de manejo segue a data da sessão.",
          },
        },
        { status: 400 },
      );
    }

    let weighedAt: Date | undefined;
    if (data.date) {
      const animal = await prisma.animal.findUnique({
        where: { id },
        select: { birthDate: true },
      });
      // birthDate é só data (UTC 00:00); comparamos no fuso local, como as demais datas.
      const birth = animal?.birthDate
        ? new Date(`${animal.birthDate.toISOString().slice(0, 10)}T00:00:00`)
        : null;

      if (birth && data.date < birth) {
        return NextResponse.json(
          {
            success: false,
            errors: {
              date: `A data não pode ser anterior ao nascimento do animal (${birth.toLocaleDateString("pt-BR")}).`,
            },
          },
          { status: 400 },
        );
      }

      // Troca só o dia e mantém o horário original, para não alterar a ordem
      // entre pesagens do mesmo dia.
      const original = weighing.weighedAt ?? weighing.createdAt;
      weighedAt = new Date(data.date);
      weighedAt.setHours(
        original.getHours(),
        original.getMinutes(),
        original.getSeconds(),
        original.getMilliseconds(),
      );
    }

    const weightChanged = !weighing.weight.equals(data.weightKg);

    await prisma.$transaction(async (tx) => {
      await tx.weighingManagementItem.update({
        where: { id: weighing.id },
        data: {
          weight: data.weightKg,
          notes: data.notes,
          ...(weighedAt ? { weighedAt } : {}),
          // Guarda o valor lançado originalmente só na primeira correção de peso.
          ...(weightChanged && !weighing.originalWeight
            ? { originalWeight: weighing.weight }
            : {}),
          correctedAt: new Date(),
        },
      });

      await recomputeCurrentWeight(tx, id);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Ocorreu um erro interno no servidor." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  const { id, weighingId } = await params;

  try {
    const weighing = await findActiveWeighing(id, weighingId);
    if (!weighing) return notFound();

    await prisma.$transaction(async (tx) => {
      await tx.weighingManagementItem.update({
        where: { id: weighing.id },
        data: { cancelledAt: new Date() },
      });

      await recomputeCurrentWeight(tx, id);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Ocorreu um erro interno no servidor." },
      { status: 500 },
    );
  }
}
