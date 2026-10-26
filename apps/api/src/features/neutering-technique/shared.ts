import type { NeuteringTechnique } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { NotFoundError } from "../../lib/errors";

// Usados por mais de uma operação de técnica de castração.

export function toNeuteringTechnique(b: {
  id: string;
  name: string;
  deactivatedAt: Date | null;
}): NeuteringTechnique {
  return {
    id: b.id,
    name: b.name,
    deactivatedAt: b.deactivatedAt?.toISOString() ?? null,
  };
}

export async function findNeuteringTechniqueOrThrow(id: string) {
  const neuteringTechnique = await prisma.neuteringTechnique.findUnique({
    where: { id },
  });
  if (!neuteringTechnique)
    throw new NotFoundError("Técnica de castração não encontrada.");
  return neuteringTechnique;
}
