import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import {
  neuteringCancelApiSchema,
  neuteringCorrectionApiSchema,
} from "../../../../schemas";
import { effectiveNeutering } from "@/server/management-session/effective";
import {
  INVALID_TECHNIQUE_MESSAGE,
  REQUIRED_TECHNIQUE_MESSAGE,
  isValidNeuteringTechnique,
} from "@/server/animal/neuterings";

type Params = { params: Promise<{ id: string; neuteringId: string }> };

async function findActiveNeutering(animalId: string, neuteringId: string) {
  const numericId = Number(neuteringId);
  if (!Number.isInteger(numericId)) return null;

  return prisma.animalNeutering.findFirst({
    where: {
      id: numericId,
      animalId,
      cancelledAt: null,
      ...effectiveNeutering,
    },
  });
}

const notFound = () =>
  NextResponse.json(
    { success: false, message: "Castração não encontrada." },
    { status: 404 },
  );

export async function PATCH(request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  const { id, neuteringId } = await params;

  try {
    const body = await request.json();
    const validation = neuteringCorrectionApiSchema.safeParse(body);

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (field && !errors[field]) errors[field] = issue.message;
      });
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    const data = validation.data;
    const neutering = await findActiveNeutering(id, neuteringId);
    if (!neutering) return notFound();

    // Só pode ficar sem técnica o registro lançado sem ela (ex.: animal que chegou castrado).
    if (neutering.techniqueId && !data.techniqueId) {
      return NextResponse.json(
        {
          success: false,
          errors: { techniqueId: REQUIRED_TECHNIQUE_MESSAGE },
        },
        { status: 400 },
      );
    }

    if (
      !(await isValidNeuteringTechnique(
        data.techniqueId,
        neutering.techniqueId,
      ))
    ) {
      return NextResponse.json(
        {
          success: false,
          errors: { techniqueId: INVALID_TECHNIQUE_MESSAGE },
        },
        { status: 400 },
      );
    }

    if (data.date && neutering.managementId) {
      return NextResponse.json(
        {
          success: false,
          errors: {
            date: "A data de uma castração feita em sessão de manejo segue a data da sessão.",
          },
        },
        { status: 400 },
      );
    }

    let neuteredAt: Date | undefined;
    if (data.date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (data.date > today) {
        return NextResponse.json(
          {
            success: false,
            errors: { date: "A data não pode ser futura." },
          },
          { status: 400 },
        );
      }

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

      // Troca só o dia e mantém o horário original.
      const original = neutering.neuteredAt;
      neuteredAt = new Date(data.date);
      neuteredAt.setHours(
        original.getHours(),
        original.getMinutes(),
        original.getSeconds(),
        original.getMilliseconds(),
      );
    }

    const firstCorrection = neutering.correctedAt === null;

    await prisma.animalNeutering.update({
      where: { id: neutering.id },
      data: {
        techniqueId: data.techniqueId,
        notes: data.notes,
        ...(neuteredAt ? { neuteredAt } : {}),
        // Guarda os valores lançados originalmente só na primeira correção.
        ...(firstCorrection
          ? {
              originalNeuteredAt: neutering.neuteredAt,
              originalTechniqueId: neutering.techniqueId,
            }
          : {}),
        correctedAt: new Date(),
      },
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

export async function DELETE(request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  const { id, neuteringId } = await params;

  try {
    const body = await request.json().catch(() => ({}));
    const validation = neuteringCancelApiSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: "Parâmetros inválidos." },
        { status: 400 },
      );
    }

    const neutering = await findActiveNeutering(id, neuteringId);
    if (!neutering) return notFound();

    await prisma.$transaction(async (tx) => {
      await tx.animalNeutering.update({
        where: { id: neutering.id },
        data: { cancelledAt: new Date() },
      });

      // Sem nenhuma castração restante, o usuário decide se o animal continua
      // castrado (pode ter chegado castrado, sem registro). Padrão: não castrado.
      const remaining = await tx.animalNeutering.count({
        where: { animalId: id, cancelledAt: null, ...effectiveNeutering },
      });
      if (remaining === 0) {
        await tx.animal.update({
          where: { id },
          data: { neutered: validation.data.keepNeutered ?? false },
        });
      }
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
