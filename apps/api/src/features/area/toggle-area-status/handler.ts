import { prisma } from "@ifarm/db";
import { ConflictError } from "@ifarm/domain/errors";
import { toggledDeactivatedAt } from "@ifarm/domain/status";
import { findOccupyingBatch } from "../availability";
import { findAreaOrThrow } from "../shared";

// Desativar uma área ocupada deixaria o lote "dentro" de uma área inativa (some do mapa,
// mas continua como área atual do lote): é preciso mover o lote antes.
export async function toggleAreaStatus(id: string) {
  const area = await findAreaOrThrow(id);

  if (!area.closedAt) {
    const occupant = await findOccupyingBatch(prisma, id);
    if (occupant) {
      throw new ConflictError(
        `A área está ocupada pelo lote "${occupant.name}". Mova o lote para outra área antes de desativar.`,
        undefined,
        { code: "OCCUPIED", batch: occupant },
      );
    }
  }

  const closedAt = toggledDeactivatedAt(area.closedAt);
  await prisma.area.update({ where: { id }, data: { closedAt } });
  return { id, closedAt: closedAt?.toISOString() ?? null };
}
