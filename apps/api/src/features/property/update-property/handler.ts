import type { PropertyInput } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { write } from "../../../lib/db-errors";
import { buildAddressWrite, toAddressData } from "../../address/persistence";
import {
  assertActiveOwner,
  findPropertyOrThrow,
  toPropertyData,
} from "../shared";

export async function updateProperty(id: string, input: PropertyInput) {
  const current = await findPropertyOrThrow(id);
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
