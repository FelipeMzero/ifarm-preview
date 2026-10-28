import type { PropertyData } from "@ifarm/shared";
import { prisma, type Prisma } from "@ifarm/db";
import { NotFoundError, ValidationError } from "../../lib/errors";

export function toPropertyData(data: PropertyData) {
  return {
    name: data.name,
    totalArea: data.totalArea,
    productiveArea: data.productiveArea,
    cib: data.cib,
    ccir: data.ccir,
    car: data.car,
    latitude: data.latitude,
    longitude: data.longitude,
    timeZone: data.timeZone,
    owner: { connect: { id: data.ownerId } },
  } satisfies Prisma.PropertyCreateInput;
}

export async function assertActiveOwner(ownerId: string) {
  const owner = await prisma.person.findUnique({
    where: { id: ownerId },
    select: { deactivatedAt: true },
  });
  if (!owner || owner.deactivatedAt) {
    throw new ValidationError("Titular inválido.", {
      ownerId: "Titular inválido.",
    });
  }
}

export async function findPropertyOrThrow(id: string) {
  const property = await prisma.property.findUnique({
    where: { id },
    select: { addressId: true, deactivatedAt: true },
  });
  if (!property) throw new NotFoundError("Propriedade não encontrada.");
  return property;
}
