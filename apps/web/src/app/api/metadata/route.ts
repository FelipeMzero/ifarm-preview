import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { requireSession } from "@/app/api/session";

export async function GET() {
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
          select: { id: true, currentTag: true, currentRfid: true, sex: true },
          orderBy: { currentTag: "asc" },
        }),
      ]);

    return NextResponse.json({
      breeds,
      batches,
      properties,
      farmAnimals: availableFarmAnimals,
    });
  } catch (error) {
    console.error("Erro ao carregar metadados:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
