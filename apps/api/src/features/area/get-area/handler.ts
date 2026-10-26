import type { AreaInput } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { NotFoundError } from "../../../lib/errors";

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
