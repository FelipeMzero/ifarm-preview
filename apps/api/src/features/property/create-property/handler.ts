import type { PropertyData } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { write } from "../../../lib/db-errors";
import { toAddressData } from "../../address/persistence.public";
import { assertActiveOwner, toPropertyData } from "../shared";

export async function createProperty(data: PropertyData) {
  await assertActiveOwner(data.ownerId);
  const address = toAddressData(data);
  const property = await write(() =>
    prisma.property.create({
      data: {
        ...toPropertyData(data),
        ...(address ? { address: { create: address } } : {}),
      },
      select: { id: true },
    }),
  );
  return { id: property.id };
}
