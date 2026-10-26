import { prisma } from "@ifarm/db";
import { toggledDeactivatedAt } from "@ifarm/domain/status";
import { findNeuteringTechniqueOrThrow, toNeuteringTechnique } from "../shared";

export async function toggleNeuteringTechniqueStatus(id: string) {
  const neuteringTechnique = await findNeuteringTechniqueOrThrow(id);
  return toNeuteringTechnique(
    await prisma.neuteringTechnique.update({
      where: { id },
      data: {
        deactivatedAt: toggledDeactivatedAt(neuteringTechnique.deactivatedAt),
      },
    }),
  );
}
