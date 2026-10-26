import type { IdentifierChangeData, IdentifierKind } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { assertNoConflicts } from "../../commitments";
import { ADAPTERS, IdentifierError, recomputeCurrent } from "../shared";

// Troca (ou remove) o identificador na hora: cria um registro avulso com a data de
// hoje, que passa a ser o mais recente.
export async function addIdentifier(
  kind: IdentifierKind,
  animalId: string,
  { value, notes }: IdentifierChangeData,
) {
  const adapter = ADAPTERS[kind];

  await prisma.$transaction(async (tx) => {
    await assertNoConflicts(tx, [animalId], { kind: "record", type: kind });
    const animal = await tx.animal.findUnique({
      where: { id: animalId },
      select: { currentTag: true, currentRfid: true },
    });
    if (!animal) throw new IdentifierError("Animal não encontrado.", 404);

    const current = animal[adapter.animalField];
    if (value === current) {
      throw new IdentifierError(
        value
          ? `Este já é o ${adapter.label.toLowerCase()} atual do animal.`
          : `O animal já está sem ${adapter.label.toLowerCase()}.`,
        400,
        "value",
      );
    }

    await adapter.create(tx, {
      animalId,
      value,
      notes,
      identifiedAt: new Date(),
    });
    await recomputeCurrent(tx, kind, animalId);
  });
}
