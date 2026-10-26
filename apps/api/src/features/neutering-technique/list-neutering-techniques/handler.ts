import type { NeuteringTechnique } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { toNeuteringTechnique } from "../shared";

export async function listNeuteringTechniques(): Promise<NeuteringTechnique[]> {
  const neuteringTechniques = await prisma.neuteringTechnique.findMany({
    orderBy: { name: "asc" },
  });
  return neuteringTechniques.map(toNeuteringTechnique);
}
