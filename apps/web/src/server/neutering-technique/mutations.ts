import "server-only";
import type { NeuteringTechniqueInput } from "@ifarm/shared";
import { prisma } from "@/server/db";
import { write } from "../db-errors";
import { NotFoundError } from "../errors";
import { toggledDeactivatedAt } from "../status";
import { toNeuteringTechnique } from "./queries";

async function findOrThrow(id: string) {
  const neuteringTechnique = await prisma.neuteringTechnique.findUnique({
    where: { id },
  });
  if (!neuteringTechnique)
    throw new NotFoundError("Técnica de castração não encontrada.");
  return neuteringTechnique;
}

export async function createNeuteringTechnique(input: NeuteringTechniqueInput) {
  return toNeuteringTechnique(
    await write(() => prisma.neuteringTechnique.create({ data: input })),
  );
}

export async function updateNeuteringTechnique(
  id: string,
  input: NeuteringTechniqueInput,
) {
  await findOrThrow(id);
  return toNeuteringTechnique(
    await write(() =>
      prisma.neuteringTechnique.update({ where: { id }, data: input }),
    ),
  );
}

// Exclusão bloqueada se houver castração vinculada (use a inativação).
export async function deleteNeuteringTechnique(id: string) {
  await findOrThrow(id);
  await write(() => prisma.neuteringTechnique.delete({ where: { id } }));
}

export async function toggleNeuteringTechniqueStatus(id: string) {
  const neuteringTechnique = await findOrThrow(id);
  return toNeuteringTechnique(
    await prisma.neuteringTechnique.update({
      where: { id },
      data: {
        deactivatedAt: toggledDeactivatedAt(neuteringTechnique.deactivatedAt),
      },
    }),
  );
}
