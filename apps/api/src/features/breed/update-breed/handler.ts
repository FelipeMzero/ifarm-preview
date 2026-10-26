import type { BreedInput } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { write } from "@ifarm/domain/db-errors";
import { findBreedOrThrow, toBreed } from "../shared";

export async function updateBreed(id: string, input: BreedInput) {
  await findBreedOrThrow(id);
  return toBreed(
    await write(() => prisma.breed.update({ where: { id }, data: input })),
  );
}
