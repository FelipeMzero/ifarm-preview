import { prisma } from "@ifarm/db";
import { requireSessionIn } from "../shared";

// Inicia o registro: o início do manejo é a hora do sistema, e cada manejo terá a hora do seu
// registro (RN-MANEJO-01). O início não muda depois.
export async function startManagementSession(id: string) {
  await prisma.$transaction(async (tx) => {
    await requireSessionIn(
      tx,
      id,
      ["planned"],
      "Somente sessões planejadas podem ser iniciadas.",
    );
    await tx.managementSession.update({
      where: { id },
      data: { performedAt: new Date() },
    });
  });
}
