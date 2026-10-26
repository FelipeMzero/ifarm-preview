import { prisma } from "@ifarm/db";
import { write } from "@ifarm/domain/db-errors";
import { findBreedOrThrow } from "../shared";

// Exclusão bloqueada se houver animal vinculado (use a inativação).
export async function deleteBreed(id: string) {
  await findBreedOrThrow(id);
  await write(() => prisma.breed.delete({ where: { id } }));
}
