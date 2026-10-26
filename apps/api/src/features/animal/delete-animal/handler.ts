import { Prisma } from "@ifarm/db";
import { deleteRecord } from "@ifarm/domain/deletion";
import { ConflictError, NotFoundError } from "@ifarm/domain/errors";
import { animalDeletionPolicy } from "../deletion-policy";

// Exclusão pela política de animal (ver deletion-policy.ts).
export async function deleteAnimal(id: string) {
  try {
    await deleteRecord(animalDeletionPolicy, id);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw new NotFoundError("Animal não encontrado.");
      }
      // Vínculo que a policy não cobre: a FK barrou a exclusão.
      if (error.code === "P2003") {
        throw new ConflictError(
          "Este registro está em uso e não pode ser excluído.",
        );
      }
    }
    throw error;
  }
}
