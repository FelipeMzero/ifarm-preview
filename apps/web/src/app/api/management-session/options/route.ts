import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { getOrAssignCurrentProperty } from "../../user/current-property/currentProperty";

// Opções usadas no planejamento e no registro: tipos de procedimento sanitário,
// técnicas de castração, pessoas (veterinário responsável) e lotes ativos da
// propriedade (apartação).
export async function GET(request: NextRequest) {
  const { response, session } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  try {
    const propertyId =
      request.nextUrl.searchParams.get("propertyId") ||
      (await getOrAssignCurrentProperty(session.user.id))?.id;

    const [healthTypes, neuteringTechniques, people, batches] =
      await Promise.all([
        prisma.healthManagementType.findMany({
          where: { deactivatedAt: null },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        }),
        prisma.neuteringTechnique.findMany({
          where: { deactivatedAt: null },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        }),
        prisma.person.findMany({
          where: { deactivatedAt: null },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        }),
        propertyId
          ? prisma.batch.findMany({
              where: { propertyId, closedAt: null },
              select: { id: true, name: true },
              orderBy: { name: "asc" },
            })
          : [],
      ]);

    return NextResponse.json({
      healthTypes,
      neuteringTechniques,
      people,
      batches,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Ocorreu um erro interno no servidor." },
      { status: 500 },
    );
  }
}
