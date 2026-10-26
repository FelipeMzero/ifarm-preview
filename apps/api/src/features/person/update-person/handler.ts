import { type PersonInput } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { buildAddressWrite, toAddressData } from "../../address/persistence";
import { write } from "@ifarm/domain/db-errors";
import { withoutImmutableFields } from "../rules";
import { findPersonOrThrow, toPersonData } from "../shared";

export async function updatePerson(id: string, input: PersonInput) {
  const current = await findPersonOrThrow(id);
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
