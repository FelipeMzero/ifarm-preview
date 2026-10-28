import { prisma } from "@ifarm/db";
import { NotFoundError } from "../../lib/errors";

// Usados por mais de uma operação de área.

export async function findAreaOrThrow(id: string) {
  const area = await prisma.area.findUnique({
    where: { id },
    select: { closedAt: true, propertyId: true },
  });
  if (!area) throw new NotFoundError("Área não encontrada.");
  return area;
}
