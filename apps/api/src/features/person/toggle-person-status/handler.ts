import { prisma } from "@ifarm/db";
import { toggledDeactivatedAt } from "@ifarm/domain/status";
import { findPersonOrThrow } from "../shared";

export async function togglePersonStatus(id: string) {
  const current = await findPersonOrThrow(id);
  const deactivatedAt = toggledDeactivatedAt(current.deactivatedAt);
  await prisma.person.update({ where: { id }, data: { deactivatedAt } });
  return { id, deactivatedAt: deactivatedAt?.toISOString() ?? null };
}
