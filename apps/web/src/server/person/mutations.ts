import "server-only";
import { toDbDate, type PersonInput } from "@ifarm/shared";
import { prisma } from "@/lib/prisma";
import { buildAddressWrite, toAddressData } from "../address";
import { dbConflict } from "../db-errors";
import { NotFoundError } from "../errors";
import { toggledDeactivatedAt, withoutImmutableFields } from "./rules";

// Converte o que veio do formulário (textos, "" para vazio) para o formato do banco.
function toPersonData(input: PersonInput) {
  return {
    type: input.type,
    taxId: input.taxId,
    name: input.name,
    stateRegistration: input.stateRegistration || null,
    phone: input.phone || null,
    email: input.email || null,
    tradeName: input.tradeName || null,
    rg: input.rg || null,
    birthDate: input.birthDate ? toDbDate(input.birthDate) : null,
    maritalStatus: input.maritalStatus || null,
  };
}

// Executa a escrita trocando os erros de unicidade e de vínculo do Prisma por ConflictError.
async function write<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw dbConflict(error) ?? error;
  }
}

async function findOrThrow(id: string) {
  const person = await prisma.person.findUnique({
    where: { id },
    select: { addressId: true, deactivatedAt: true },
  });
  if (!person) throw new NotFoundError("Pessoa não encontrada.");
  return person;
}

export async function createPerson(input: PersonInput) {
  const address = toAddressData(input);
  const person = await write(() =>
    prisma.person.create({
      data: {
        ...toPersonData(input),
        ...(address ? { address: { create: address } } : {}),
      },
      select: { id: true },
    }),
  );
  return { id: person.id };
}

export async function updatePerson(id: string, input: PersonInput) {
  const current = await findOrThrow(id);
  await write(() =>
    prisma.person.update({
      where: { id },
      data: {
        ...withoutImmutableFields(toPersonData(input)),
        ...buildAddressWrite(toAddressData(input), current.addressId),
      },
    }),
  );
  return { id };
}

export async function deletePerson(id: string) {
  await findOrThrow(id);
  await write(() => prisma.person.delete({ where: { id } }));
}

export async function togglePersonStatus(id: string) {
  const current = await findOrThrow(id);
  const deactivatedAt = toggledDeactivatedAt(current.deactivatedAt);
  await prisma.person.update({ where: { id }, data: { deactivatedAt } });
  return { id, deactivatedAt: deactivatedAt?.toISOString() ?? null };
}
