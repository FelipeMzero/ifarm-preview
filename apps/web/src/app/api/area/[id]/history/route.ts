import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";

// Lotes que ocuparam a área, do mais recente para o mais antigo.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS.areas);
  if (response) return response;

  const { id } = await params;

  try {
    const histories = await prisma.batchAreaHistory.findMany({
      where: { areaId: id },
      orderBy: { enteredAt: "desc" },
      include: { batch: { select: { id: true, name: true } } },
    });

    return NextResponse.json({
      data: histories.map((h) => ({
        id: h.id,
        batch: h.batch,
        enteredAt: h.enteredAt.toISOString(),
        exitedAt: h.exitedAt?.toISOString() ?? null,
        notes: h.notes,
      })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Ocorreu um erro interno no servidor." },
      { status: 500 },
    );
  }
}
