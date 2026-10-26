import { prisma } from "@ifarm/db";
import { write } from "../../../lib/db-errors";
import { findPropertyOrThrow } from "../shared";

export async function deleteProperty(id: string) {
  await findPropertyOrThrow(id);
  await write(() => prisma.property.delete({ where: { id } }));
}
