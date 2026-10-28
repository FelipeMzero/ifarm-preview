import type { AreaData } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { write } from "../../../lib/db-errors";
import { findAreaOrThrow } from "../shared";

// A propriedade da área não muda na edição (propertyId: undefined = mantém).
export async function updateArea(id: string, data: AreaData) {
  await findAreaOrThrow(id);
  await write(() =>
    prisma.area.update({
      where: { id },
      data: { ...data, propertyId: undefined },
    }),
  );
  return { id };
}
