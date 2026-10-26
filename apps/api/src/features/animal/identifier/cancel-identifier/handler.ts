import type { IdentifierKind } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { ADAPTERS, identifierNotFound, recomputeCurrent } from "../shared";

// Exclusão lógica: o registro sai do histórico e o identificador atual é recalculado.
export async function cancelIdentifier(
  kind: IdentifierKind,
  animalId: string,
  recordIdParam: string,
) {
  await prisma.$transaction(async (tx) => {
    const record = await ADAPTERS[kind].find(
      tx,
      animalId,
      Number(recordIdParam),
    );
    if (!record) throw identifierNotFound(kind);

    await ADAPTERS[kind].update(tx, record.id, { cancelledAt: new Date() });
    await recomputeCurrent(tx, kind, animalId);
  });
}
