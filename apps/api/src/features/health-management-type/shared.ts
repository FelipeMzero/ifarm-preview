import type { HealthManagementType } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { NotFoundError } from "@ifarm/domain/errors";

// Usados por mais de uma operação de tipo de manejo sanitário.

export function toHealthManagementType(b: {
  id: string;
  name: string;
  deactivatedAt: Date | null;
}): HealthManagementType {
  return {
    id: b.id,
    name: b.name,
    deactivatedAt: b.deactivatedAt?.toISOString() ?? null,
  };
}

export async function findHealthManagementTypeOrThrow(id: string) {
  const healthManagementType = await prisma.healthManagementType.findUnique({
    where: { id },
  });
  if (!healthManagementType)
    throw new NotFoundError("Tipo de manejo sanitário não encontrado.");
  return healthManagementType;
}
