import type { NeuteringTechniqueInput } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { write } from "@ifarm/domain/db-errors";
import { toNeuteringTechnique } from "../shared";

export async function createNeuteringTechnique(input: NeuteringTechniqueInput) {
  return toNeuteringTechnique(
    await write(() => prisma.neuteringTechnique.create({ data: input })),
  );
}
