import type { PersonPayload } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { fromDbDate } from "../../../lib/db-dates";
import { NotFoundError } from "../../../lib/errors";

// Devolve a pessoa no mesmo formato do formulário, para edição e detalhes.
export async function getPerson(id: string): Promise<PersonPayload> {
  const person = await prisma.person.findUnique({
    where: { id },
    include: { address: true },
  });
  if (!person) throw new NotFoundError("Pessoa não encontrada.");

  return {
    type: person.type,
    taxId: person.taxId,
    name: person.name,
    stateRegistration: person.stateRegistration ?? "",
    phone: person.phone ?? "",
    email: person.email ?? "",
    tradeName: person.tradeName ?? "",
    rg: person.rg ?? "",
    birthDate: person.birthDate ? fromDbDate(person.birthDate) : "",
    maritalStatus: person.maritalStatus ?? "",
    zipCode: person.address?.zipCode ?? "",
    street: person.address?.street ?? "",
    number: person.address?.number ?? "",
    complement: person.address?.complement ?? "",
    neighborhood: person.address?.neighborhood ?? "",
    city: person.address?.city ?? "",
    state: person.address?.state ?? "",
  };
}
