import {
  instantToZonedIso,
  type AnimalIdentifierRecord,
  type IdentifierKind,
} from "@ifarm/shared";
import { Prisma } from "@ifarm/db";
import { BusinessError } from "../../../lib/errors";
import type { ZoneOf } from "../../property/time-zone";
import {
  effectiveRfidTagging,
  effectiveTagging,
} from "../../management-session/effective";
import { toZonedIso } from "../../property/time-zone";

type Tx = Prisma.TransactionClient;

// Brinco e RFID têm a mesma regra de histórico: cada troca é um registro, o valor
// atual do animal (currentTag/currentRfid) é o do registro válido mais recente, e as
// correções preservam o rastro (valor original na primeira correção, exclusão lógica).
// Usado pelas operações de identificador (listar, trocar, corrigir e excluir).
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

export const ADAPTERS: Record<IdentifierKind, IdentifierAdapter> = {
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

// A data vai no fuso da propriedade onde a identificação aconteceu (`zoneOf`).
export function toIdentifierDto(
  r: IdentifierRecord,
  zoneOf: ZoneOf,
): AnimalIdentifierRecord {
  return {
    id: r.id,
    date: instantToZonedIso(r.identifiedAt, zoneOf(r.identifiedAt)),
    value: r.value,
    notes: r.notes,
    fromSession: r.managementId != null,
    correctedAt: r.correctedAt
      ? toZonedIso(r.correctedAt, zoneOf(r.correctedAt))
      : null,
    originalValue: r.original,
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

export const identifierNotFound = (kind: IdentifierKind) =>
  new IdentifierError(
    `Registro de ${ADAPTERS[kind].label} não encontrado.`,
    404,
  );
