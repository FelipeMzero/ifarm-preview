import type { PropertyData } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { NotFoundError, ValidationError } from "../../lib/errors";

// Regras de propriedade (docs/requirements/mod-02-propriedades.md):
// - RN-PROPRIEDADE-01 (registro fundiário único): restrições `@unique` em cib/ccir/car; o
//   conflito vira ConflictError por write().
// - RN-PROPRIEDADE-02 (titular obrigatório): campo obrigatório no propertySchema e, aqui,
//   titular precisa ser uma pessoa ativa (assertActiveOwner).
// - RN-PROPRIEDADE-03 (área produtiva ≤ total): propertySchema, em @ifarm/shared.
// - RN-PROPRIEDADE-04 (localização obrigatória) e RN-PROPRIEDADE-05 (fuso horário): campos
//   obrigatórios no propertySchema; o fuso é um dos fusos do Brasil (BR_TIME_ZONES).
// - Exclusão bloqueada por áreas ou usuários vinculados: FKs com onDelete: Restrict.

// Os campos da propriedade (já convertidos pelo propertySchema); o endereço vai para a tabela
// própria (toAddressData) e o nome do titular é só da tela.
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
  };
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
