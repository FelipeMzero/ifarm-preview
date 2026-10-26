import type { Breed } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { NotFoundError } from "@ifarm/domain/errors";

// Usados por mais de uma operação de raça.

export function toBreed(b: {
  id: string;
  name: string;
  deactivatedAt: Date | null;
}): Breed {
  return {
    id: b.id,
    name: b.name,
    deactivatedAt: b.deactivatedAt?.toISOString() ?? null,
  };
}

export async function findBreedOrThrow(id: string) {
  const breed = await prisma.breed.findUnique({ where: { id } });
  if (!breed) throw new NotFoundError("Raça não encontrada.");
  return breed;
}
