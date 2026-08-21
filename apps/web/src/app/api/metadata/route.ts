import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export async function GET(_request: NextRequest) {
  const { response } = await requireSession();
  if (response) return response;

  try {
    const [breeds, batches, properties, availableFarmAnimals] =
      await Promise.all([
        prisma.breed.findMany({
          where: { deactivatedAt: null },
          orderBy: { name: "asc" },
        }),
        prisma.batch.findMany({ orderBy: { name: "asc" } }),
        prisma.property.findMany({
          where: { deactivatedAt: null },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        }),
        prisma.animal.findMany({
          select: { id: true, earTag: true, rfid: true, sex: true },
          orderBy: { earTag: "asc" },
        }),
      ]);

    return NextResponse.json({
      breeds,
      batches,
      properties,
      farmAnimals: availableFarmAnimals,
    });
  } catch (error: any) {
    console.error("Erro ao carregar metadados:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
