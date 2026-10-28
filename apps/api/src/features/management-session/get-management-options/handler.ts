import type { ManagementOptions } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { getOrAssignCurrentProperty } from "../../current-property/resolve";

// Opções usadas no planejamento e no registro: tipos de procedimento sanitário,
// técnicas de castração, pessoas (veterinário responsável) e lotes ativos da
// propriedade (apartação).
export async function getManagementOptions(
  propertyIdParam: string | null,
  userId: string,
): Promise<ManagementOptions> {
  const propertyId =
    propertyIdParam || (await getOrAssignCurrentProperty(userId))?.id;

  const [healthTypes, neuteringTechniques, people, batches] = await Promise.all(
    [
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
    ],
  );

  return { healthTypes, neuteringTechniques, people, batches };
}
