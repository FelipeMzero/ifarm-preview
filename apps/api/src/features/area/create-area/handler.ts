import type { AreaInput } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { write } from "@ifarm/domain/db-errors";
import { ValidationError } from "@ifarm/domain/errors";
import { toAreaData } from "../shared";

export async function createArea(input: AreaInput) {
  const property = await prisma.property.findUnique({
    where: { id: input.propertyId },
    select: { deactivatedAt: true },
  });
  if (!property || property.deactivatedAt) {
    throw new ValidationError("Propriedade inválida ou inativa.", {
      propertyId: "Propriedade inválida ou inativa.",
    });
  }

  const area = await write(() =>
    prisma.area.create({
      data: { ...toAreaData(input), propertyId: input.propertyId },
      select: { id: true },
    }),
  );
  return { id: area.id };
}
