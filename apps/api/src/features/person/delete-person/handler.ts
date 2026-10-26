import { prisma } from "@ifarm/db";
import { write } from "@ifarm/domain/db-errors";
import { findPersonOrThrow } from "../shared";

export async function deletePerson(id: string) {
  await findPersonOrThrow(id);
  await write(() => prisma.person.delete({ where: { id } }));
}
