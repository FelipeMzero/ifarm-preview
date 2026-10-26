import { prisma } from "@ifarm/db";
import { write } from "../../../lib/db-errors";
import { findAreaOrThrow } from "../shared";

export async function deleteArea(id: string) {
  await findAreaOrThrow(id);
  await write(() => prisma.area.delete({ where: { id } }));
}
