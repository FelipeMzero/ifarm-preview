import { prisma } from "@ifarm/db";
import { ConflictError } from "../../../lib/errors";
import { toggledDeactivatedAt } from "../../../lib/status";
import { findOccupyingBatch } from "../availability";
import { findAreaOrThrow } from "../shared";
import { propertyTimeZone, toZonedIso } from "../../property/time-zone";

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
  return {
    id,
    closedAt: toZonedIso(closedAt, await propertyTimeZone(area.propertyId)),
  };
}
