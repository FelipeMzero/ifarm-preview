import { prisma } from "@ifarm/db";
import { write } from "@ifarm/domain/db-errors";
import { NotFoundError } from "@ifarm/domain/errors";

export async function deleteBatch(id: string) {
  const batch = await prisma.batch.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!batch) throw new NotFoundError("Lote não encontrado.");
  await write(() => prisma.batch.delete({ where: { id } }));
}
