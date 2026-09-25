import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { sortWeighings, toWeighingDto, weighingInclude } from "../../weighings";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  const { id } = await params;

  try {
    const items = await prisma.animalWeighing.findMany({
      where: { animalId: id, cancelledAt: null },
      include: weighingInclude,
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
