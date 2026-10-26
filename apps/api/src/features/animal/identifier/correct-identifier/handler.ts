import {
  toLocalDateTime,
  type IdentifierCorrectionData,
  type IdentifierKind,
} from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import {
  ADAPTERS,
  IdentifierError,
  identifierNotFound,
  recomputeCurrent,
} from "../shared";
import { keepsOriginal, sessionDateLock } from "../../rules";

// Corrige valor, data (só registros avulsos) e observação de um brinco/RFID.
export async function correctIdentifier(
  kind: IdentifierKind,
  animalId: string,
  recordIdParam: string,
  data: IdentifierCorrectionData,
) {
  const adapter = ADAPTERS[kind];

  await prisma.$transaction(async (tx) => {
    const record = await adapter.find(tx, animalId, Number(recordIdParam));
    if (!record) throw identifierNotFound(kind);

    const dateLock = sessionDateLock(record, data.date, "identificação");
    if (dateLock) throw new IdentifierError(dateLock, 400, "date");

    let identifiedAt: Date | undefined;
    if (data.date) {
      identifiedAt = toLocalDateTime(data.date);
      if (identifiedAt > new Date()) {
        throw new IdentifierError("A data não pode ser futura.", 400, "date");
      }
    }

    const valueChanged = data.value !== record.value;
    await adapter.update(tx, record.id, {
      value: data.value,
      notes: data.notes,
      ...(identifiedAt ? { identifiedAt } : {}),
      // Guarda o valor lançado originalmente só na primeira correção do valor.
      ...(keepsOriginal(valueChanged, record.original)
        ? { original: record.value }
        : {}),
      correctedAt: new Date(),
    });

    await recomputeCurrent(tx, kind, animalId);
  });
}
