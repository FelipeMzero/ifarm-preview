import type { PropertyInput } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { NotFoundError, ValidationError } from "@ifarm/domain/errors";

// Regras de propriedade (docs/requirements/mod-02-propriedades.md):
// - RN-PROPRIEDADE-01 (registro fundiário único): restrições `@unique` em cib/ccir/car; o
//   conflito vira ConflictError por write().
// - RN-PROPRIEDADE-02 (titular obrigatório): campo obrigatório no propertySchema e, aqui,
//   titular precisa ser uma pessoa ativa (assertActiveOwner).
// - RN-PROPRIEDADE-03 (área produtiva ≤ total): propertySchema, em @ifarm/shared.
// - Exclusão bloqueada por áreas ou usuários vinculados: FKs com onDelete: Restrict.

// Converte o que veio do formulário (números como texto, "" para vazio) para o formato do banco.
export function toPropertyData(input: PropertyInput) {
  const number = (v?: string) => (v ? parseFloat(v) : null);
  return {
    name: input.name,
    totalArea: number(input.totalArea),
    productiveArea: number(input.productiveArea),
    cib: input.cib || null,
    ccir: input.ccir || null,
    car: input.car || null,
    latitude: number(input.latitude),
    longitude: number(input.longitude),
    owner: { connect: { id: input.ownerId } },
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
