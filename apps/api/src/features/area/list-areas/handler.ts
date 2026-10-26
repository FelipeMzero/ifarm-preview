import type { AreaQuery, AreaRow } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { getOrAssignCurrentProperty } from "@ifarm/domain/current-property/queries";
import { areasLastExit, areasOccupancy } from "@ifarm/domain/stocking/queries";
import { areaRotation, areaStatus } from "../rules";

// Áreas da propriedade informada ou, sem ela, da propriedade atual do usuário; cada uma com a
// ocupação de hoje e a última saída de lote.
export async function listAreas(
  { propertyId, status, search, availableOnly }: AreaQuery,
  userId: string,
): Promise<AreaRow[]> {
  const resolvedPropertyId =
    propertyId ?? (await getOrAssignCurrentProperty(userId))?.id;
  if (!resolvedPropertyId) return [];

  const areas = await prisma.area.findMany({
    where: {
      propertyId: resolvedPropertyId,
      ...(status === "active" ? { closedAt: null } : {}),
      ...(status === "inactive" ? { closedAt: { not: null } } : {}),
      ...(search
        ? { name: { contains: search, mode: "insensitive" as const } }
        : {}),
      ...(availableOnly
        ? {
            batchAreaHistories: {
              none: { exitedAt: null, batch: { closedAt: null } },
            },
          }
        : {}),
    },
    orderBy: { name: "asc" },
  });

  const lastExit = await areasLastExit(areas.map((a) => a.id));
  const occupancy = await areasOccupancy(
    areas.map((a) => ({
      id: a.id,
      hectares: a.hectares.toNumber(),
      stockingRate: a.stockingRate.toNumber(),
    })),
  );

  const now = new Date();
  return areas.map((a) => {
    const state = {
      closedAt: a.closedAt?.toISOString() ?? null,
      defaultOccupationDays: a.defaultOccupationDays,
      defaultRestDays: a.defaultRestDays,
      occupancy: occupancy.get(a.id) ?? null,
      lastExitAt: lastExit.get(a.id) ?? null,
    };
    const rotation = areaRotation(state, now);
    return {
      id: a.id,
      name: a.name,
      polygon: a.polygon,
      hectares: a.hectares.toNumber(),
      stockingRate: a.stockingRate.toNumber(),
      notes: a.notes,
      propertyId: a.propertyId,
      updatedAt: a.updatedAt.toISOString(),
      ...state,
      status: areaStatus(state, rotation),
      rotation,
    };
  });
}
