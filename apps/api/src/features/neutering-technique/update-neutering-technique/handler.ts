import type { NeuteringTechniqueInput } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { write } from "@ifarm/domain/db-errors";
import { findNeuteringTechniqueOrThrow, toNeuteringTechnique } from "../shared";

export async function updateNeuteringTechnique(
  id: string,
  input: NeuteringTechniqueInput,
) {
  await findNeuteringTechniqueOrThrow(id);
  return toNeuteringTechnique(
    await write(() =>
      prisma.neuteringTechnique.update({ where: { id }, data: input }),
    ),
  );
}
