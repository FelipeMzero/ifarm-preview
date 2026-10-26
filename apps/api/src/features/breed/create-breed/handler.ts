import type { BreedInput } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { write } from "@ifarm/domain/db-errors";
import { toBreed } from "../shared";

export async function createBreed(input: BreedInput) {
  return toBreed(await write(() => prisma.breed.create({ data: input })));
}
