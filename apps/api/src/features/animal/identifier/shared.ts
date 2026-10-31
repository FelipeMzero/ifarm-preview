import {
  instantToZonedIso,
  type AnimalIdentifierRecord,
  type IdentifierKind,
} from "@ifarm/shared";
import { Prisma } from "@ifarm/db";
import { BusinessError } from "../../../lib/errors";
import type { ZoneOf } from "../../property/time-zone.public";
import {
  effectiveRfidTagging,
  effectiveTagging,
} from "../../management-session/effective.public";
import { toZonedIso } from "../../property/time-zone.public";
import { previousVersions } from "../rules";

type Tx = Prisma.TransactionClient;

// Brinco e RFID têm a mesma regra de histórico: cada troca é um registro, o valor
// atual do animal (currentTag/currentRfid) é o do registro válido mais recente, e os
// registros não são alterados: corrigir cancela o registro e insere outro, que aponta para ele.
// Usado pelas operações de identificador (listar, trocar, corrigir e excluir).
export const isIdentifierKind = (kind: string): kind is IdentifierKind =>
  kind === "tag" || kind === "rfid";

type IdentifierRecord = {
  id: number;
  value: string | null;
  notes: string | null;
  identifiedAt: Date;
  managementId: string | null;
  replacesId: number | null;
  cancelledAt: Date | null;
  createdAt: Date;
};

type IdentifierAdapter = {
  label: string;
  animalField: "currentTag" | "currentRfid";
  /** Registros efetivos do animal, inclusive cancelados, do mais recente para o mais antigo. */
  history(tx: Tx, animalId: string): Promise<IdentifierRecord[]>;
  find(
    tx: Tx,
    animalId: string,
    recordId: number,
  ): Promise<IdentifierRecord | null>;
  /** Cancela o registro; devolve quantos cancelou (0 = já estava cancelado). */
  cancel(tx: Tx, recordId: number): Promise<{ count: number }>;
  create(
    tx: Tx,
    data: {
      animalId: string;
      value: string | null;
      notes: string | null;
      identifiedAt: Date;
      managementId?: string | null;
      replacesId?: number;
    },
  ): Promise<unknown>;
};

const orderBy = [{ identifiedAt: "desc" as const }, { id: "desc" as const }];

export const ADAPTERS: Record<IdentifierKind, IdentifierAdapter> = {
  tag: {
    label: "Brinco",
    animalField: "currentTag",
    history: async (tx, animalId) =>
      (
        await tx.animalTagging.findMany({
          where: { animalId, ...effectiveTagging },
          orderBy,
        })
      ).map((r) => ({ ...r, value: r.tag })),
    find: async (tx, animalId, id) => {
      if (!Number.isInteger(id)) return null;
      const r = await tx.animalTagging.findFirst({
        where: { id, animalId, cancelledAt: null, ...effectiveTagging },
      });
      return r ? { ...r, value: r.tag } : null;
    },
    cancel: (tx, id) =>
      tx.animalTagging.updateMany({
        where: { id, cancelledAt: null },
        data: { cancelledAt: new Date() },
      }),
    create: (tx, { value, ...data }) =>
      tx.animalTagging.create({ data: { ...data, tag: value } }),
  },
  rfid: {
    label: "RFID",
    animalField: "currentRfid",
    history: async (tx, animalId) =>
      (
        await tx.animalRfidTagging.findMany({
          where: { animalId, ...effectiveRfidTagging },
          orderBy,
        })
      ).map((r) => ({ ...r, value: r.rfid })),
    find: async (tx, animalId, id) => {
      if (!Number.isInteger(id)) return null;
      const r = await tx.animalRfidTagging.findFirst({
        where: { id, animalId, cancelledAt: null, ...effectiveRfidTagging },
      });
      return r ? { ...r, value: r.rfid } : null;
    },
    cancel: (tx, id) =>
      tx.animalRfidTagging.updateMany({
        where: { id, cancelledAt: null },
        data: { cancelledAt: new Date() },
      }),
    create: (tx, { value, ...data }) =>
      tx.animalRfidTagging.create({ data: { ...data, rfid: value } }),
  },
};

// Registros válidos do animal, do mais recente para o mais antigo.
export async function validRecords(
  tx: Tx,
  kind: IdentifierKind,
  animalId: string,
) {
  const all = await ADAPTERS[kind].history(tx, animalId);
  return all.filter((r) => !r.cancelledAt);
}

// A data vai no fuso da propriedade onde a identificação aconteceu (`zoneOf`). `all` são os
// registros do animal, inclusive cancelados, de onde saem as versões anteriores do corrigido.
export function toIdentifierDto(
  r: IdentifierRecord,
  zoneOf: ZoneOf,
  all: IdentifierRecord[],
): AnimalIdentifierRecord {
  return {
    id: r.id,
    date: instantToZonedIso(r.identifiedAt, zoneOf(r.identifiedAt)),
    value: r.value,
    notes: r.notes,
    fromSession: r.managementId != null,
    // Uma correção é um registro novo: foi corrigido quando ele foi criado.
    correctedAt:
      r.replacesId != null
        ? toZonedIso(r.createdAt, zoneOf(r.createdAt))
        : null,
    previousVersions: previousVersions(r, all).map((v) => ({
      recordedAt: instantToZonedIso(v.createdAt, zoneOf(v.createdAt)),
      date: instantToZonedIso(v.identifiedAt, zoneOf(v.identifiedAt)),
      value: v.value,
      notes: v.notes,
    })),
  };
}

export class IdentifierError extends BusinessError {}

// O identificador atual passa a ser o do registro válido mais recente (null = removido).
export async function recomputeCurrent(
  tx: Tx,
  kind: IdentifierKind,
  animalId: string,
) {
  const adapter = ADAPTERS[kind];
  const [latest] = await validRecords(tx, kind, animalId);
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

export const identifierNotFound = (kind: IdentifierKind) =>
  new IdentifierError(
    `Registro de ${ADAPTERS[kind].label} não encontrado.`,
    404,
  );
