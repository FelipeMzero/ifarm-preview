import "server-only";
import type { NeuteringTechnique } from "@ifarm/shared";
import { prisma } from "@ifarm/db";

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

export async function listNeuteringTechniques(): Promise<NeuteringTechnique[]> {
  const neuteringTechniques = await prisma.neuteringTechnique.findMany({
    orderBy: { name: "asc" },
  });
  return neuteringTechniques.map(toNeuteringTechnique);
}
