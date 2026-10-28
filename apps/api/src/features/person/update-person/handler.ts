import { type PersonData } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { write } from "../../../lib/db-errors";
import {
  buildAddressWrite,
  toAddressData,
} from "../../address/persistence.public";
import { withoutImmutableFields } from "../rules";
import { findPersonOrThrow, toPersonData } from "../shared";

export async function updatePerson(id: string, data: PersonData) {
  const current = await findPersonOrThrow(id);
  await write(() =>
    prisma.person.update({
      where: { id },
      data: {
        ...withoutImmutableFields(toPersonData(data)),
        ...buildAddressWrite(toAddressData(data), current.addressId),
      },
    }),
  );
  return { id };
}
