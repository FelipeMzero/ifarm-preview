import type { PropertyInput } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { NotFoundError } from "../../../lib/errors";

// Devolve a propriedade no mesmo formato do formulário, para edição e detalhes.
export async function getProperty(id: string): Promise<PropertyInput> {
  const property = await prisma.property.findUnique({
    where: { id },
    include: { address: true, owner: true },
  });
  if (!property) throw new NotFoundError("Propriedade não encontrada.");

  return {
    name: property.name,
    ownerId: property.ownerId,
    ownerName: property.owner.name,
    totalArea: property.totalArea?.toString() ?? "",
    productiveArea: property.productiveArea?.toString() ?? "",
    cib: property.cib ?? "",
    ccir: property.ccir ?? "",
    car: property.car ?? "",
    latitude: property.latitude?.toString() ?? "",
    longitude: property.longitude?.toString() ?? "",
    zipCode: property.address?.zipCode ?? "",
    street: property.address?.street ?? "",
    number: property.address?.number ?? "",
    complement: property.address?.complement ?? "",
    neighborhood: property.address?.neighborhood ?? "",
    city: property.address?.city ?? "",
    state: property.address?.state ?? "",
  };
}
