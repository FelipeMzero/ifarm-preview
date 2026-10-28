import type { PropertyInput } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { write } from "../../../lib/db-errors";
import { toAddressData } from "../../address/persistence.public";
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
