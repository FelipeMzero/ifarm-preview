import { prisma } from "@ifarm/db";
import { toggledDeactivatedAt } from "../../../lib/status";
import {
  findHealthManagementTypeOrThrow,
  toHealthManagementType,
} from "../shared";

export async function toggleHealthManagementTypeStatus(id: string) {
  const healthManagementType = await findHealthManagementTypeOrThrow(id);
  return toHealthManagementType(
    await prisma.healthManagementType.update({
      where: { id },
      data: {
        deactivatedAt: toggledDeactivatedAt(healthManagementType.deactivatedAt),
      },
    }),
  );
}
