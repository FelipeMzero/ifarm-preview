import type { PropertyOption } from "@ifarm/shared";
import { prisma } from "@ifarm/db";

// Lista enxuta para o seletor de propriedade atual: só as ativas.
export async function listPropertyOptions(): Promise<PropertyOption[]> {
  return prisma.property.findMany({
    where: { deactivatedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
