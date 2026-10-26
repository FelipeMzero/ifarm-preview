import type { HealthManagementTypeInput } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { write } from "@ifarm/domain/db-errors";
import {
  findHealthManagementTypeOrThrow,
  toHealthManagementType,
} from "../shared";

export async function updateHealthManagementType(
  id: string,
  input: HealthManagementTypeInput,
) {
  await findHealthManagementTypeOrThrow(id);
  return toHealthManagementType(
    await write(() =>
      prisma.healthManagementType.update({ where: { id }, data: input }),
    ),
  );
}
