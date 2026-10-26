import type { PropertyInput } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { toAddressData } from "@ifarm/domain/address";
import { write } from "@ifarm/domain/db-errors";
import { assertActiveOwner, toPropertyData } from "../shared";

export async function createProperty(input: PropertyInput) {
  await assertActiveOwner(input.ownerId);
  const address = toAddressData(input);
  const property = await write(() =>
    prisma.property.create({
      data: {
        ...toPropertyData(input),
        ...(address ? { address: { create: address } } : {}),
      },
      select: { id: true },
    }),
  );
  return { id: property.id };
}
