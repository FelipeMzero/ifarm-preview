import "server-only";
import type { PropertyInput } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { buildAddressWrite, toAddressData } from "../address";
import { write } from "../db-errors";
import { NotFoundError, ValidationError } from "../errors";
import { toggledDeactivatedAt } from "../status";

// Regras de propriedade (docs/requirements/mod-02-propriedades.md):
// - RN-PROPRIEDADE-01 (registro fundiário único): restrições `@unique` em cib/ccir/car; o
//   conflito vira ConflictError por write().
// - RN-PROPRIEDADE-02 (titular obrigatório): campo obrigatório no propertySchema e, aqui,
//   titular precisa ser uma pessoa ativa (assertActiveOwner).
// - RN-PROPRIEDADE-03 (área produtiva ≤ total): propertySchema, em @ifarm/shared.
// - Exclusão bloqueada por áreas ou usuários vinculados: FKs com onDelete: Restrict.

// Converte o que veio do formulário (números como texto, "" para vazio) para o formato do banco.
function toPropertyData(input: PropertyInput) {
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

async function assertActiveOwner(ownerId: string) {
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

async function findOrThrow(id: string) {
  const property = await prisma.property.findUnique({
    where: { id },
    select: { addressId: true, deactivatedAt: true },
  });
  if (!property) throw new NotFoundError("Propriedade não encontrada.");
  return property;
}

export async function createProperty(input: PropertyInput) {
  await assertActiveOwner(input.ownerId);
  const address = toAddressData(input);
  const property = await write(() =>
    prisma.property.create({
      data: {
        ...toPropertyData(input),
        ...(address ? { address: { create: address } } : {}),
      },
      select: { id: true },
    }),
  );
  return { id: property.id };
}

export async function updateProperty(id: string, input: PropertyInput) {
  const current = await findOrThrow(id);
  await assertActiveOwner(input.ownerId);
  await write(() =>
    prisma.property.update({
      where: { id },
      data: {
        ...toPropertyData(input),
        ...buildAddressWrite(toAddressData(input), current.addressId),
      },
    }),
  );
  return { id };
}

export async function deleteProperty(id: string) {
  await findOrThrow(id);
  await write(() => prisma.property.delete({ where: { id } }));
}

export async function togglePropertyStatus(id: string) {
  const current = await findOrThrow(id);
  const deactivatedAt = toggledDeactivatedAt(current.deactivatedAt);
  await prisma.property.update({ where: { id }, data: { deactivatedAt } });
  return { id, deactivatedAt: deactivatedAt?.toISOString() ?? null };
}
