import "server-only";
import type { CurrentProperty } from "@ifarm/shared";
import { prisma } from "@/lib/prisma";
import { NotFoundError } from "../errors";

// Troca a propriedade em que o usuário está trabalhando.
export async function setCurrentProperty(
  userId: string,
  propertyId: string,
): Promise<CurrentProperty> {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, name: true },
  });
  if (!property) throw new NotFoundError("Propriedade não encontrada.");

  await prisma.userSettings.upsert({
    where: { userId },
    create: { userId, currentPropertyId: propertyId },
    update: { currentPropertyId: propertyId },
  });

  return property;
}
