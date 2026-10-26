import type { AreaInput } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { write } from "../../../lib/db-errors";
import { findAreaOrThrow, toAreaData } from "../shared";

// A propriedade da área não muda na edição.
export async function updateArea(id: string, input: AreaInput) {
  await findAreaOrThrow(id);
  await write(() =>
    prisma.area.update({ where: { id }, data: toAreaData(input) }),
  );
  return { id };
}
