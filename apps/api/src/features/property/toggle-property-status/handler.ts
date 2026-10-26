import { prisma } from "@ifarm/db";
import { toggledDeactivatedAt } from "@ifarm/domain/status";
import { findPropertyOrThrow } from "../shared";

export async function togglePropertyStatus(id: string) {
  const current = await findPropertyOrThrow(id);
  const deactivatedAt = toggledDeactivatedAt(current.deactivatedAt);
  await prisma.property.update({ where: { id }, data: { deactivatedAt } });
  return { id, deactivatedAt: deactivatedAt?.toISOString() ?? null };
}
