import { prisma } from "@ifarm/db";
import { toggledDeactivatedAt } from "@ifarm/domain/status";
import { findBreedOrThrow, toBreed } from "../shared";

export async function toggleBreedStatus(id: string) {
  const breed = await findBreedOrThrow(id);
  return toBreed(
    await prisma.breed.update({
      where: { id },
      data: { deactivatedAt: toggledDeactivatedAt(breed.deactivatedAt) },
    }),
  );
}
