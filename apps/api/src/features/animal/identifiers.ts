import {
  toLocalDateTime,
  type AnimalIdentifierRecord,
  type IdentifierChangeData,
  type IdentifierCorrectionData,
  type IdentifierKind,
} from "@ifarm/shared";
import { prisma, Prisma } from "@ifarm/db";
import {
  effectiveRfidTagging,
  effectiveTagging,
} from "../management-session/effective";
import { assertNoConflicts } from "./commitments";
import { BusinessError } from "@ifarm/domain/errors";
import { keepsOriginal, sessionDateLock } from "./rules";

type Tx = Prisma.TransactionClient;

// Brinco e RFID têm a mesma regra de histórico: cada troca é um registro, o valor
// atual do animal (currentTag/currentRfid) é o do registro válido mais recente, e as
// correções preservam o rastro (valor original na primeira correção, exclusão lógica).
export const isIdentifierKind = (kind: string): kind is IdentifierKind =>
  kind === "tag" || kind === "rfid";

type IdentifierRecord = {
  id: number;
  value: string | null;
  original: string | null;
  notes: string | null;
  identifiedAt: Date;
  managementId: string | null;
  correctedAt: Date | null;
};

type IdentifierAdapter = {
  label: string;
  animalField: "currentTag" | "currentRfid";
  list(tx: Tx, animalId: string): Promise<IdentifierRecord[]>;
  find(
    tx: Tx,
    animalId: string,
    recordId: number,
  ): Promise<IdentifierRecord | null>;
  update(
    tx: Tx,
    recordId: number,
    data: {
      value?: string | null;
      original?: string | null;
      notes?: string | null;
      identifiedAt?: Date;
      correctedAt?: Date;
      cancelledAt?: Date;
    },
  ): Promise<unknown>;
  create(
    tx: Tx,
    data: {
      animalId: string;
      value: string | null;
      notes: string | null;
      identifiedAt: Date;
    },
  ): Promise<unknown>;
};

const orderBy = [{ identifiedAt: "desc" as const }, { id: "desc" as const }];

const ADAPTERS: Record<IdentifierKind, IdentifierAdapter> = {
  tag: {
    label: "Brinco",
    animalField: "currentTag",
    list: async (tx, animalId) =>
      (
        await tx.animalTagging.findMany({
          where: { animalId, cancelledAt: null, ...effectiveTagging },
          orderBy,
        })
      ).map((r) => ({ ...r, value: r.tag, original: r.originalTag })),
    find: async (tx, animalId, id) => {
      if (!Number.isInteger(id)) return null;
      const r = await tx.animalTagging.findFirst({
        where: { id, animalId, cancelledAt: null, ...effectiveTagging },
      });
      return r ? { ...r, value: r.tag, original: r.originalTag } : null;
    },
    update: (tx, id, { value, original, ...data }) =>
      tx.animalTagging.update({
        where: { id },
        data: {
          ...data,
          ...(value !== undefined ? { tag: value } : {}),
          ...(original !== undefined ? { originalTag: original } : {}),
        },
      }),
    create: (tx, { value, ...data }) =>
      tx.animalTagging.create({ data: { ...data, tag: value } }),
  },
  rfid: {
    label: "RFID",
    animalField: "currentRfid",
    list: async (tx, animalId) =>
      (
        await tx.animalRfidTagging.findMany({
          where: { animalId, cancelledAt: null, ...effectiveRfidTagging },
          orderBy,
        })
      ).map((r) => ({ ...r, value: r.rfid, original: r.originalRfid })),
    find: async (tx, animalId, id) => {
      if (!Number.isInteger(id)) return null;
      const r = await tx.animalRfidTagging.findFirst({
        where: { id, animalId, cancelledAt: null, ...effectiveRfidTagging },
      });
      return r ? { ...r, value: r.rfid, original: r.originalRfid } : null;
    },
    update: (tx, id, { value, original, ...data }) =>
      tx.animalRfidTagging.update({
        where: { id },
        data: {
          ...data,
          ...(value !== undefined ? { rfid: value } : {}),
          ...(original !== undefined ? { originalRfid: original } : {}),
        },
      }),
    create: (tx, { value, ...data }) =>
      tx.animalRfidTagging.create({ data: { ...data, rfid: value } }),
  },
};

export function toIdentifierDto(r: IdentifierRecord): AnimalIdentifierRecord {
  return {
    id: r.id,
    date: r.identifiedAt.toISOString(),
    value: r.value,
    notes: r.notes,
    fromSession: r.managementId != null,
    correctedAt: r.correctedAt?.toISOString() ?? null,
    originalValue: r.original,
  };
}

class IdentifierError extends BusinessError {}

// O identificador atual passa a ser o do registro válido mais recente (null = removido).
async function recomputeCurrent(
  tx: Tx,
  kind: IdentifierKind,
  animalId: string,
) {
  const adapter = ADAPTERS[kind];
  const [latest] = await adapter.list(tx, animalId);
  const value = latest?.value ?? null;

  const animal = await tx.animal.findUniqueOrThrow({
    where: { id: animalId },
    select: { currentPropertyId: true, status: true },
  });
  if (value && animal.status === "ACTIVE") {
    const holder = await tx.animal.findFirst({
      where: {
        id: { not: animalId },
        currentPropertyId: animal.currentPropertyId,
        status: "ACTIVE",
        [adapter.animalField]: value,
      },
      select: { code: true },
    });
    if (holder) {
      throw new IdentifierError(
        `${adapter.label} ${value} já está em uso pelo animal de ID ${holder.code}.`,
        409,
        "value",
      );
    }
  }

  await tx.animal.update({
    where: { id: animalId },
    data: { [adapter.animalField]: value },
  });
}

// Histórico válido (não excluído), do mais recente para o mais antigo.
export async function listIdentifiers(kind: IdentifierKind, animalId: string) {
  const records = await ADAPTERS[kind].list(prisma, animalId);
  return records.map(toIdentifierDto);
}

const recordNotFound = (kind: IdentifierKind) =>
  new IdentifierError(
    `Registro de ${ADAPTERS[kind].label} não encontrado.`,
    404,
  );

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
    if (!record) throw recordNotFound(kind);

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

// Exclusão lógica: o registro sai do histórico e o identificador atual é recalculado.
export async function cancelIdentifier(
  kind: IdentifierKind,
  animalId: string,
  recordIdParam: string,
) {
  await prisma.$transaction(async (tx) => {
    const record = await ADAPTERS[kind].find(
      tx,
      animalId,
      Number(recordIdParam),
    );
    if (!record) throw recordNotFound(kind);

    await ADAPTERS[kind].update(tx, record.id, { cancelledAt: new Date() });
    await recomputeCurrent(tx, kind, animalId);
  });
}
