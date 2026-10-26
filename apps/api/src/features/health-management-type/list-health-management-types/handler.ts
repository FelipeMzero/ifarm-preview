import type { HealthManagementType } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { toHealthManagementType } from "../shared";

export async function listHealthManagementTypes(): Promise<
  HealthManagementType[]
> {
  const healthManagementTypes = await prisma.healthManagementType.findMany({
    orderBy: { name: "asc" },
  });
  return healthManagementTypes.map(toHealthManagementType);
}
