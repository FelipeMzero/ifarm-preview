import "server-only";
import { z } from "zod";
import type {
  AreaInput,
  AreaOccupancyHistoryEntry,
  AreaRow,
} from "@ifarm/shared";
import { prisma } from "@/server/db";
import { getOrAssignCurrentProperty } from "../current-property/queries";
import { NotFoundError } from "../errors";
import { areasLastExit, areasOccupancy } from "../stocking/queries";

export const areaQuerySchema = z.object({
  propertyId: z.preprocess(
    (v) =>
      typeof v === "string" &&
      (v.trim() === "" || v === "undefined" || v === "null")
        ? undefined
        : v,
    z.uuid().optional(),
  ),
  status: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.enum(["active", "inactive"]).optional().default("active"),
  ),
  search: z.string().trim().optional().default(""),
  availableOnly: z.preprocess(
    (v) => v === "true" || v === true,
    z.boolean().optional(),
  ),
});

export type AreaQuery = z.infer<typeof areaQuerySchema>;

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

  return areas.map((a) => ({
    id: a.id,
    name: a.name,
    polygon: a.polygon,
    hectares: a.hectares.toNumber(),
    stockingRate: a.stockingRate.toNumber(),
    defaultOccupationDays: a.defaultOccupationDays,
    defaultRestDays: a.defaultRestDays,
    notes: a.notes,
    propertyId: a.propertyId,
    closedAt: a.closedAt?.toISOString() ?? null,
    updatedAt: a.updatedAt.toISOString(),
    occupancy: occupancy.get(a.id) ?? null,
    lastExitAt: lastExit.get(a.id) ?? null,
  }));
}

// Devolve a área no mesmo formato do formulário, para edição.
export async function getArea(id: string): Promise<AreaInput> {
  const area = await prisma.area.findUnique({ where: { id } });
  if (!area) throw new NotFoundError("Área não encontrada.");

  return {
    name: area.name,
    polygon: area.polygon,
    hectares: String(area.hectares.toNumber()),
    stockingRate: String(area.stockingRate.toNumber()),
    defaultOccupationDays: area.defaultOccupationDays?.toString() ?? "",
    defaultRestDays: area.defaultRestDays?.toString() ?? "",
    notes: area.notes ?? "",
    propertyId: area.propertyId,
  };
}

// Lotes que ocuparam a área, do mais recente para o mais antigo.
export async function getAreaOccupancyHistory(
  areaId: string,
): Promise<AreaOccupancyHistoryEntry[]> {
  const histories = await prisma.batchAreaHistory.findMany({
    where: { areaId },
    orderBy: { enteredAt: "desc" },
    include: { batch: { select: { id: true, name: true } } },
  });

  return histories.map((h) => ({
    id: h.id,
    batch: h.batch,
    enteredAt: h.enteredAt.toISOString(),
    exitedAt: h.exitedAt?.toISOString() ?? null,
    notes: h.notes,
  }));
}
