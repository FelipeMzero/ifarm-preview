import "server-only";
import type { HealthManagementTypeInput } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { write } from "../db-errors";
import { NotFoundError } from "../errors";
import { toggledDeactivatedAt } from "../status";
import { toHealthManagementType } from "./queries";

async function findOrThrow(id: string) {
  const healthManagementType = await prisma.healthManagementType.findUnique({
    where: { id },
  });
  if (!healthManagementType)
    throw new NotFoundError("Tipo de manejo sanitário não encontrado.");
  return healthManagementType;
}

export async function createHealthManagementType(
  input: HealthManagementTypeInput,
) {
  return toHealthManagementType(
    await write(() => prisma.healthManagementType.create({ data: input })),
  );
}

export async function updateHealthManagementType(
  id: string,
  input: HealthManagementTypeInput,
) {
  await findOrThrow(id);
  return toHealthManagementType(
    await write(() =>
      prisma.healthManagementType.update({ where: { id }, data: input }),
    ),
  );
}

// Exclusão bloqueada se houver procedimento sanitário vinculado (use a inativação).
export async function deleteHealthManagementType(id: string) {
  await findOrThrow(id);
  await write(() => prisma.healthManagementType.delete({ where: { id } }));
}

export async function toggleHealthManagementTypeStatus(id: string) {
  const healthManagementType = await findOrThrow(id);
  return toHealthManagementType(
    await prisma.healthManagementType.update({
      where: { id },
      data: {
        deactivatedAt: toggledDeactivatedAt(healthManagementType.deactivatedAt),
      },
    }),
  );
}
