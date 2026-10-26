import type { HealthManagementTypeInput } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { write } from "@ifarm/domain/db-errors";
import { toHealthManagementType } from "../shared";

export async function createHealthManagementType(
  input: HealthManagementTypeInput,
) {
  return toHealthManagementType(
    await write(() => prisma.healthManagementType.create({ data: input })),
  );
}
