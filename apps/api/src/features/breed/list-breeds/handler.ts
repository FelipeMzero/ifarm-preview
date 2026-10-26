import type { Breed } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { toBreed } from "../shared";

export async function listBreeds(): Promise<Breed[]> {
  const breeds = await prisma.breed.findMany({ orderBy: { name: "asc" } });
  return breeds.map(toBreed);
}
