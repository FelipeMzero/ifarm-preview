import type { Breed } from "@ifarm/shared";
import { prisma } from "@ifarm/db";

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

export async function listBreeds(): Promise<Breed[]> {
  const breeds = await prisma.breed.findMany({ orderBy: { name: "asc" } });
  return breeds.map(toBreed);
}
