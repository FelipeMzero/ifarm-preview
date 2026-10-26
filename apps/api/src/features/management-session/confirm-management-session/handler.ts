import { prisma } from "@ifarm/db";
import { consolidateSession } from "../consolidate";

// Consolida a sessão (ver consolidateSession).
export async function confirmManagementSession(id: string) {
  return prisma.$transaction((tx) => consolidateSession(tx, id), {
    timeout: 60_000,
  });
}
