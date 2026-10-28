import { type PersonData } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { write } from "../../../lib/db-errors";
import { toAddressData } from "../../address/persistence.public";
import { toPersonData } from "../shared";

export async function createPerson(data: PersonData) {
  const address = toAddressData(data);
  const person = await write(() =>
    prisma.person.create({
      data: {
        ...toPersonData(data),
        ...(address ? { address: { create: address } } : {}),
      },
      select: { id: true },
    }),
  );
  return { id: person.id };
}
