import { z } from "zod";
import { FIELD_LIMITS } from "@/lib/field-limits";
import { animalLabel, summarize } from "../../batch-transfer/shared";
import {
  defineStep,
  StepError,
  stepNotesSchema,
  type StepAnimal,
  type Tx,
} from "./types";

type IdentifierItem = {
  id: number;
  animalId: string;
  value: string | null;
  notes: string | null;
};

// O que difere entre brinco e RFID: tabelas e campo do animal.
type IdentifierAdapter = {
  type: "tag" | "rfid";
  label: string;
  /** "o brinco" / "o RFID", para as mensagens. */
  article: string;
  animalField: "currentTag" | "currentRfid";
  maxLength: number;
  findContainer(tx: Tx, sessionId: string): Promise<{ id: string } | null>;
  upsertContainer(tx: Tx, sessionId: string): Promise<unknown>;
  deleteContainer(tx: Tx, id: string): Promise<unknown>;
  findItems(
    tx: Tx,
    sessionId: string,
    animalIds?: string[],
  ): Promise<IdentifierItem[]>;
  createItem(
    tx: Tx,
    data: {
      managementId: string;
      animalId: string;
      value: string;
      notes: string | null;
      identifiedAt: Date;
    },
  ): Promise<unknown>;
  updateItem(
    tx: Tx,
    id: number,
    data: { value: string; notes: string | null },
  ): Promise<unknown>;
  deleteItems(tx: Tx, sessionId: string, animalId: string): Promise<unknown>;
  setIdentifiedAt(tx: Tx, managementId: string, at: Date): Promise<unknown>;
};

const sessionFilter = (sessionId: string, animalIds?: string[]) => ({
  management: { managementSessionId: sessionId },
  ...(animalIds ? { animalId: { in: animalIds } } : {}),
});

const tagAdapter: IdentifierAdapter = {
  type: "tag",
  label: "Brinco",
  article: "o brinco",
  animalField: "currentTag",
  maxLength: FIELD_LIMITS.animal.earTag,
  findContainer: (tx, sessionId) =>
    tx.tagManagement.findUnique({ where: { managementSessionId: sessionId } }),
  upsertContainer: (tx, sessionId) =>
    tx.tagManagement.upsert({
      where: { managementSessionId: sessionId },
      create: { managementSessionId: sessionId },
      update: {},
    }),
  deleteContainer: (tx, id) => tx.tagManagement.delete({ where: { id } }),
  findItems: async (tx, sessionId, animalIds) =>
    (
      await tx.animalTagging.findMany({
        where: sessionFilter(sessionId, animalIds),
      })
    ).map((i) => ({ ...i, value: i.tag })),
  createItem: (tx, { value, ...data }) =>
    tx.animalTagging.create({ data: { ...data, tag: value } }),
  updateItem: (tx, id, { value, notes }) =>
    tx.animalTagging.update({ where: { id }, data: { tag: value, notes } }),
  deleteItems: (tx, sessionId, animalId) =>
    tx.animalTagging.deleteMany({
      where: { ...sessionFilter(sessionId), animalId },
    }),
  setIdentifiedAt: (tx, managementId, at) =>
    tx.animalTagging.updateMany({
      where: { managementId },
      data: { identifiedAt: at },
    }),
};

const rfidAdapter: IdentifierAdapter = {
  type: "rfid",
  label: "RFID",
  article: "o RFID",
  animalField: "currentRfid",
  maxLength: FIELD_LIMITS.animal.rfid,
  findContainer: (tx, sessionId) =>
    tx.rfidManagement.findUnique({ where: { managementSessionId: sessionId } }),
  upsertContainer: (tx, sessionId) =>
    tx.rfidManagement.upsert({
      where: { managementSessionId: sessionId },
      create: { managementSessionId: sessionId },
      update: {},
    }),
  deleteContainer: (tx, id) => tx.rfidManagement.delete({ where: { id } }),
  findItems: async (tx, sessionId, animalIds) =>
    (
      await tx.animalRfidTagging.findMany({
        where: sessionFilter(sessionId, animalIds),
      })
    ).map((i) => ({ ...i, value: i.rfid })),
  createItem: (tx, { value, ...data }) =>
    tx.animalRfidTagging.create({ data: { ...data, rfid: value } }),
  updateItem: (tx, id, { value, notes }) =>
    tx.animalRfidTagging.update({
      where: { id },
      data: { rfid: value, notes },
    }),
  deleteItems: (tx, sessionId, animalId) =>
    tx.animalRfidTagging.deleteMany({
      where: { ...sessionFilter(sessionId), animalId },
    }),
  setIdentifiedAt: (tx, managementId, at) =>
    tx.animalRfidTagging.updateMany({
      where: { managementId },
      data: { identifiedAt: at },
    }),
};

// Animais ativos da propriedade que usam hoje um dos valores. Os que recebem outro
// identificador nesta mesma sessão vão liberá-lo na consolidação e não contam.
async function findHolders(
  tx: Tx,
  adapter: IdentifierAdapter,
  propertyId: string,
  values: string[],
  releasing: Set<string>,
) {
  const holders = await tx.animal.findMany({
    where: {
      currentPropertyId: propertyId,
      status: "ACTIVE",
      [adapter.animalField]: { in: values },
    },
    select: {
      id: true,
      code: true,
      currentTag: true,
      currentRfid: true,
    },
  });
  return holders.filter((h) => !releasing.has(h.id));
}

function identifierStep(adapter: IdentifierAdapter) {
  return defineStep({
    type: adapter.type,
    consolidateOrder: adapter.type === "tag" ? 30 : 40,

    planSchema: z.object({ type: z.literal(adapter.type) }),

    async prepare(tx, session) {
      await adapter.upsertContainer(tx, session.id);
      return { type: adapter.type };
    },

    async dispose(tx, session) {
      const management = await adapter.findContainer(tx, session.id);
      if (!management) return;
      const items = await adapter.findItems(tx, session.id);
      if (items.length) {
        throw new StepError(
          `${adapter.label} já foi registrado em ${items.length} animal(is). Desfaça os registros antes de remover a etapa.`,
          409,
        );
      }
      await adapter.deleteContainer(tx, management.id);
    },

    async describe() {
      return { label: adapter.label };
    },

    async load(tx, session, _step, animalIds) {
      const items = await adapter.findItems(tx, session.id, animalIds);
      return new Map(
        items.map((i) => [i.animalId, { value: i.value, notes: i.notes }]),
      );
    },

    payloadSchema: z.object({
      value: z
        .string()
        .trim()
        .min(1, "Este campo é obrigatório")
        .max(adapter.maxLength, `Máximo de ${adapter.maxLength} caracteres`),
      notes: stepNotesSchema,
    }),

    async save(tx, session, _step, animal: StepAnimal, payload) {
      const management = await adapter.findContainer(tx, session.id);
      if (!management) {
        throw new StepError(`Etapa de ${adapter.label} não encontrada.`);
      }

      if (animal[adapter.animalField] === payload.value) {
        throw new StepError(
          `Este já é ${adapter.article} atual do animal.`,
          400,
          "value",
        );
      }

      const items = await adapter.findItems(tx, session.id);
      if (
        items.some((i) => i.animalId !== animal.id && i.value === payload.value)
      ) {
        throw new StepError(
          `${adapter.label} já registrado para outro animal nesta sessão.`,
          409,
          "value",
        );
      }

      const releasing = new Set(items.map((i) => i.animalId));
      const holders = await findHolders(
        tx,
        adapter,
        session.propertyId,
        [payload.value],
        releasing,
      );
      if (holders.some((h) => h.id !== animal.id)) {
        throw new StepError(
          `${adapter.label} já está em uso pelo animal ${animalLabel(holders[0])}.`,
          409,
          "value",
        );
      }

      const existing = items.find((i) => i.animalId === animal.id);
      if (existing) {
        await adapter.updateItem(tx, existing.id, {
          value: payload.value,
          notes: payload.notes,
        });
      } else {
        await adapter.createItem(tx, {
          managementId: management.id,
          animalId: animal.id,
          value: payload.value,
          notes: payload.notes,
          identifiedAt: session.managementDate,
        });
      }
    },

    async clear(tx, session, _step, animalId) {
      await adapter.deleteItems(tx, session.id, animalId);
    },

    async consolidate(tx, session, _step, effectiveAt) {
      const management = await adapter.findContainer(tx, session.id);
      if (!management) return;
      const items = (await adapter.findItems(tx, session.id)).filter(
        (i): i is IdentifierItem & { value: string } => i.value != null,
      );
      if (!items.length) return;

      // Alguém pode ter usado o identificador fora da sessão depois do registro.
      const releasing = new Set(items.map((i) => i.animalId));
      const holders = await findHolders(
        tx,
        adapter,
        session.propertyId,
        items.map((i) => i.value),
        releasing,
      );
      if (holders.length) {
        throw new StepError(
          `${adapter.label} registrado na sessão já está em uso por: ${summarize(
            holders.map(animalLabel),
          )}. Corrija o registro antes de consolidar.`,
          409,
        );
      }

      await adapter.setIdentifiedAt(tx, management.id, effectiveAt);

      // Libera primeiro os valores atuais: permite trocar identificadores entre
      // animais da sessão sem esbarrar no índice único.
      await tx.animal.updateMany({
        where: { id: { in: [...releasing] } },
        data: { [adapter.animalField]: null },
      });
      for (const item of items) {
        await tx.animal.update({
          where: { id: item.animalId },
          data: { [adapter.animalField]: item.value },
        });
      }
    },
  });
}

export const tagStep = identifierStep(tagAdapter);
export const rfidStep = identifierStep(rfidAdapter);
