import type { PropertyData } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { write } from "../../../lib/db-errors";
import {
  buildAddressWrite,
  toAddressData,
} from "../../address/persistence.public";
import {
  assertActiveOwner,
  findPropertyOrThrow,
  toPropertyData,
} from "../shared";

export async function updateProperty(id: string, data: PropertyData) {
  const current = await findPropertyOrThrow(id);
  await assertActiveOwner(data.ownerId);
  await write(() =>
    prisma.property.update({
      where: { id },
      data: {
        ...toPropertyData(data),
        ...buildAddressWrite(toAddressData(data), current.addressId),
      },
    }),
  );
  return { id };
}
