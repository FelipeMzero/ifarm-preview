import { type PersonData } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { toDbDate } from "../../lib/db-dates";
import { NotFoundError } from "../../lib/errors";

// Usados por mais de uma operação de pessoa.

// Os campos da pessoa (já convertidos pelo personSchema), com a data no formato do banco; o
// endereço vai para a tabela própria (toAddressData).
export function toPersonData(data: PersonData) {
  return {
    type: data.type,
    taxId: data.taxId,
    name: data.name,
    stateRegistration: data.stateRegistration,
    phone: data.phone,
    email: data.email,
    tradeName: data.tradeName,
    rg: data.rg,
    birthDate: data.birthDate ? toDbDate(data.birthDate) : null,
    maritalStatus: data.maritalStatus,
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
