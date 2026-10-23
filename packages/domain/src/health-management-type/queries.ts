import "server-only";
import type { HealthManagementType } from "@ifarm/shared";
import { prisma } from "@/server/db";

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

export async function listHealthManagementTypes(): Promise<
  HealthManagementType[]
> {
  const healthManagementTypes = await prisma.healthManagementType.findMany({
    orderBy: { name: "asc" },
  });
  return healthManagementTypes.map(toHealthManagementType);
}
