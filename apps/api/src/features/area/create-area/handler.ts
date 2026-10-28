import type { AreaData } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { write } from "../../../lib/db-errors";
import { ValidationError } from "../../../lib/errors";

export async function createArea(data: AreaData) {
  const property = await prisma.property.findUnique({
    where: { id: data.propertyId },
    select: { deactivatedAt: true },
  });
  if (!property || property.deactivatedAt) {
    throw new ValidationError("Propriedade inválida ou inativa.", {
      propertyId: "Propriedade inválida ou inativa.",
    });
  }

  const area = await write(() =>
    prisma.area.create({
      data,
      select: { id: true },
    }),
  );
  return { id: area.id };
}
