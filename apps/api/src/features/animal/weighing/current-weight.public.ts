import { Prisma } from "@ifarm/db";
import { effectiveWeighing } from "../../management-session/effective.public";

// Peso atual do animal: recalculado por toda mudança nas pesagens, inclusive as feitas pelas
// sessões de manejo.

type Tx = Prisma.TransactionClient;

// Recalcula o peso atual (campo desnormalizado) a partir da pesagem válida mais recente.
export async function recomputeCurrentWeight(tx: Tx, animalId: string) {
  const latest = await tx.animalWeighing.findFirst({
    where: { animalId, cancelledAt: null, ...effectiveWeighing },
    orderBy: [{ weighedAt: "desc" }, { id: "desc" }],
  });

  await tx.animal.update({
    where: { id: animalId },
    data: { currentWeight: latest?.weight ?? null },
  });
}
