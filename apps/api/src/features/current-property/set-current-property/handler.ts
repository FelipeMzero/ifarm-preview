import type { CurrentProperty } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { NotFoundError } from "../../../lib/errors";
import { withTimeZone } from "../resolve";

// Troca a propriedade em que o usuário está trabalhando.
export async function setCurrentProperty(
  userId: string,
  propertyId: string,
): Promise<CurrentProperty> {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, name: true, timeZone: true },
  });
  if (!property) throw new NotFoundError("Propriedade não encontrada.");

  await prisma.userSettings.upsert({
    where: { userId },
    create: { userId, currentPropertyId: propertyId },
    update: { currentPropertyId: propertyId },
  });

  return withTimeZone(property);
}
