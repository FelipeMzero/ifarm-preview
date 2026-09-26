import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { weighingCreateApiSchema } from "../../../schemas";
import { resolveEventDate } from "../../eventDate";
import {
  recomputeCurrentWeight,
  sortWeighings,
  toWeighingDto,
} from "../../weighings";
import { effectiveWeighing } from "../../../management-session/effective";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  const { id } = await params;

  try {
    const items = await prisma.animalWeighing.findMany({
      where: { animalId: id, cancelledAt: null, ...effectiveWeighing },
    });

    return NextResponse.json(sortWeighings(items.map(toWeighingDto)));
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Ocorreu um erro interno no servidor." },
      { status: 500 },
    );
  }
}

// Registra uma pesagem avulsa na hora (o peso atual passa a ser o da mais recente).
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  const { id } = await params;

  try {
    const validation = weighingCreateApiSchema.safeParse(
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
    const date = await resolveEventDate(id, data.date);
    if (!date.ok) {
      return NextResponse.json(
        { success: false, errors: { date: date.error } },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.animalWeighing.create({
        data: {
          animalId: id,
          weight: data.weightKg,
          notes: data.notes,
          weighedAt: date.at,
        },
      });
      await recomputeCurrentWeight(tx, id);
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Ocorreu um erro interno no servidor." },
      { status: 500 },
    );
  }
}
