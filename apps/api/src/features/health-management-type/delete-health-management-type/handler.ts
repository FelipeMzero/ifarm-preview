import { prisma } from "@ifarm/db";
import { write } from "../../../lib/db-errors";
import { findHealthManagementTypeOrThrow } from "../shared";

// Exclusão bloqueada se houver procedimento sanitário vinculado (use a inativação).
export async function deleteHealthManagementType(id: string) {
  await findHealthManagementTypeOrThrow(id);
  await write(() => prisma.healthManagementType.delete({ where: { id } }));
}
