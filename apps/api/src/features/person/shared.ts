import { type PersonData } from "@ifarm/shared";
import { prisma, type Prisma } from "@ifarm/db";
import { toDbDate } from "../../lib/db-dates";
import { NotFoundError } from "../../lib/errors";

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
  } satisfies Prisma.PersonCreateInput;
}

export async function findPersonOrThrow(id: string) {
  const person = await prisma.person.findUnique({
    where: { id },
    select: { addressId: true, deactivatedAt: true },
  });
  if (!person) throw new NotFoundError("Pessoa não encontrada.");
  return person;
}
