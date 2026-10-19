import "server-only";
import type { BreedInput } from "@ifarm/shared";
import { prisma } from "@/server/db";
import { write } from "../db-errors";
import { NotFoundError } from "../errors";
import { toggledDeactivatedAt } from "../status";
import { toBreed } from "./queries";

async function findOrThrow(id: string) {
  const breed = await prisma.breed.findUnique({ where: { id } });
  if (!breed) throw new NotFoundError("Raça não encontrada.");
  return breed;
}

export async function createBreed(input: BreedInput) {
  return toBreed(await write(() => prisma.breed.create({ data: input })));
}

export async function updateBreed(id: string, input: BreedInput) {
  await findOrThrow(id);
  return toBreed(
    await write(() => prisma.breed.update({ where: { id }, data: input })),
  );
}

// Exclusão bloqueada se houver animal vinculado (use a inativação).
export async function deleteBreed(id: string) {
  await findOrThrow(id);
  await write(() => prisma.breed.delete({ where: { id } }));
}

export async function toggleBreedStatus(id: string) {
  const breed = await findOrThrow(id);
  return toBreed(
    await prisma.breed.update({
      where: { id },
      data: { deactivatedAt: toggledDeactivatedAt(breed.deactivatedAt) },
    }),
  );
}
