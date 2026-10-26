import { type PersonInput } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { toDbDate } from "../../lib/db-dates";
import { NotFoundError } from "../../lib/errors";

// Usados por mais de uma operação de pessoa.

// Converte o que veio do formulário (textos, "" para vazio) para o formato do banco.
export function toPersonData(input: PersonInput) {
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

export async function findPersonOrThrow(id: string) {
  const person = await prisma.person.findUnique({
    where: { id },
    select: { addressId: true, deactivatedAt: true },
  });
  if (!person) throw new NotFoundError("Pessoa não encontrada.");
  return person;
}
