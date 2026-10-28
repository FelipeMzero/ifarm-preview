import {
  zonedDateTimeToInstant,
  type IdentifierCorrectionData,
  type IdentifierKind,
} from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { animalStays, timeZoneAt } from "../../../property/time-zone.public";
import { keepsOriginal, sessionDateLock } from "../../rules";
import {
  ADAPTERS,
  IdentifierError,
  identifierNotFound,
  recomputeCurrent,
} from "../shared";

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
      // A data nova vale no fuso da propriedade onde a identificação aconteceu.
      const { stays, current } = await animalStays(animalId, tx);
      identifiedAt = zonedDateTimeToInstant(
        data.date,
        timeZoneAt(stays, record.identifiedAt, current),
      );
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
