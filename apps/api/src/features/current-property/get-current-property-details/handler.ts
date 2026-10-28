import type { CurrentPropertyDetails } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { getOrAssignCurrentProperty } from "../resolve.public";

// Detalhes da propriedade atual, para o painel.
export async function getCurrentPropertyDetails(
  userId: string,
): Promise<CurrentPropertyDetails | null> {
  const current = await getOrAssignCurrentProperty(userId);
  if (!current) return null;

  const property = await prisma.property.findUnique({
    where: { id: current.id },
    select: {
      id: true,
      name: true,
      totalArea: true,
      productiveArea: true,
      owner: { select: { name: true } },
      address: { select: { city: true, state: true } },
    },
  });
  if (!property) return null;

  return {
    id: property.id,
    name: property.name,
    ownerName: property.owner.name,
    totalArea: property.totalArea?.toNumber() ?? null,
    productiveArea: property.productiveArea?.toNumber() ?? null,
    city: property.address?.city ?? null,
    state: property.address?.state ?? null,
  };
}
