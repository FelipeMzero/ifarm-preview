import { type PersonInput } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { toAddressData } from "@ifarm/domain/address";
import { write } from "@ifarm/domain/db-errors";
import { toPersonData } from "../shared";

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
