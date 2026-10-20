import "server-only";
import type { z } from "zod";
import {
  animalLabel,
  stepKey,
  summarize,
  type ReceptionDocumentsData,
} from "@ifarm/shared";
import { prisma } from "@/server/db";
import { assertNoConflicts } from "../animal/commitments";
import { getOrAssignCurrentProperty } from "../current-property/queries";
import {
  findReception,
  receiveAnimal,
  removeReceivedAnimal,
  type receiveAnimalSchema,
} from "../purchase/reception";
import { loadAnimalContext } from "./animalContext";
import { consolidateSession } from "./consolidate";
import { clearAnimalStep, saveAnimalStep } from "./records";
import type {
  managementSessionApiSchema,
  managementSessionStartApiSchema,
} from "./schemas";
import {
  applyPlanSteps,
  invalidAnimals,
  invalidAnimalsMessage,
  requireManagementDate,
  requireSessionIn,
  sessionIntent,
  StepError,
  type LoadedSession,
} from "./shared";
import { countDone, loadStepRecords, stepModule } from "./steps";
import type { Tx } from "./steps/types";

type ManagementSessionData = z.output<typeof managementSessionApiSchema>;
type ManagementSessionStartData = z.output<
  typeof managementSessionStartApiSchema
>;

// Planeja uma sessão: data prevista, etapas e animais participantes.
export async function createManagementSession(
  data: ManagementSessionData,
  userId: string,
) {
  const propertyId =
    data.propertyId ?? (await getOrAssignCurrentProperty(userId))?.id;
  if (!propertyId) {
    throw new StepError("Nenhuma propriedade selecionada.", 400);
  }

  if (!data.steps.length) {
    throw new StepError("Adicione ao menos um manejo.", 400, "steps");
  }

  const animalIds = [...new Set(data.animalIds)];

  const id = await prisma.$transaction(async (tx) => {
    const invalid = await invalidAnimals(tx, propertyId, animalIds);
    if (invalid.length) {
      throw new StepError(invalidAnimalsMessage(invalid), 400, "animalIds");
    }

    const created = await tx.managementSession.create({
      data: {
        propertyId,
        title: data.title,
        scheduledAt: data.scheduledAt,
        notes: data.notes,
        participants: {
          create: animalIds.map((animalId) => ({ animalId })),
        },
      },
    });

    const steps = await applyPlanSteps(
      tx,
      { ...created, performedAt: null },
      [],
      data.steps,
    );
    await assertNoConflicts(tx, animalIds, sessionIntent(steps, false), {
      sessionId: created.id,
    });
    return created.id;
  });
  return { id };
}

// Altera o planejamento (data prevista, observação, etapas e participantes). Vale
// enquanto a sessão não for consolidada ou cancelada, inclusive durante o registro.
export async function updateManagementSession(
  id: string,
  data: ManagementSessionData,
) {
  const animalIds = [...new Set(data.animalIds)];

  await prisma.$transaction(async (tx) => {
    const session = await requireSessionIn(
      tx,
      id,
      ["planned", "in_progress"],
      "Somente sessões não consolidadas podem ser alteradas.",
    );
    const reception = await findReception(tx, id);
    if (!reception && !data.steps.length) {
      throw new StepError("Adicione ao menos um manejo.", 400, "steps");
    }

    // Na recepção os participantes são os animais recebidos (não vêm do planejamento).
    const participants = reception
      ? null
      : await updateParticipants(tx, session, animalIds);

    const steps = await applyPlanSteps(tx, session, session.steps, data.steps);

    if (participants) {
      await assertNoConflicts(
        tx,
        participants.added,
        sessionIntent(steps, false),
        { sessionId: id },
      );
      // Quem já participava só é checado nas etapas acrescentadas ao planejamento.
      const previous = new Set(session.steps.map(stepKey));
      const newKeys = steps.map(stepKey).filter((key) => !previous.has(key));
      if (newKeys.length) {
        await assertNoConflicts(
          tx,
          participants.kept,
          { kind: "session", stepKeys: newKeys },
          { sessionId: id },
        );
      }
    }

    await tx.managementSession.update({
      where: { id },
      data: {
        title: data.title,
        scheduledAt: data.scheduledAt,
        notes: data.notes,
      },
    });
  });
}

async function updateParticipants(
  tx: Tx,
  session: LoadedSession,
  animalIds: string[],
) {
  const id = session.id;
  const current = await tx.managementParticipant.findMany({
    where: { managementSessionId: id },
    include: {
      animal: {
        select: { code: true, currentTag: true, currentRfid: true },
      },
    },
  });
  const nextIds = new Set(animalIds);
  const currentIds = new Set(current.map((p) => p.animalId));
  const removed = current.filter((p) => !nextIds.has(p.animalId));
  const added = animalIds.filter((a) => !currentIds.has(a));
  const kept = animalIds.filter((a) => currentIds.has(a));

  const invalid = await invalidAnimals(tx, session.propertyId, added);
  if (invalid.length) {
    throw new StepError(invalidAnimalsMessage(invalid), 400, "animalIds");
  }

  // Quem já tem registro só sai pela tela de registro (que desfaz os registros).
  if (removed.length) {
    const records = await loadStepRecords(
      tx,
      session,
      session.steps,
      removed.map((p) => p.animalId),
    );
    const handled = removed.filter((p) => countDone(records, p.animalId));
    if (handled.length) {
      throw new StepError(
        `Animais com manejo já registrado não podem sair pelo planejamento: ${summarize(
          handled.map((p) => animalLabel(p.animal)),
        )}. Remova-os pela tela de registro.`,
        409,
        "animalIds",
      );
    }
    await tx.managementParticipant.deleteMany({
      where: { id: { in: removed.map((p) => p.id) } },
    });
  }

  if (added.length) {
    await tx.managementParticipant.createMany({
      data: added.map((animalId) => ({
        managementSessionId: id,
        animalId,
      })),
    });
  }

  return { added, kept };
}

// Inicia o registro informando a data em que o manejo acontece. Também serve para
// corrigir essa data enquanto a sessão não for consolidada: os registros recebem a
// data definitiva na consolidação.
export async function startManagementSession(
  id: string,
  data: ManagementSessionStartData,
) {
  const { performedAt } = data;
  if (performedAt > new Date()) {
    throw new StepError(
      "A data do manejo não pode ser futura.",
      400,
      "performedAt",
    );
  }

  await prisma.$transaction(async (tx) => {
    await requireSessionIn(
      tx,
      id,
      ["planned", "in_progress"],
      "Somente sessões não consolidadas podem ser iniciadas.",
    );
    await tx.managementSession.update({
      where: { id },
      data: { performedAt },
    });
  });
}

// Consolida a sessão (ver consolidateSession).
export async function confirmManagementSession(id: string) {
  return prisma.$transaction((tx) => consolidateSession(tx, id), {
    timeout: 60_000,
  });
}

// Cancela a sessão. Os registros feitos continuam gravados (para auditoria), mas como a
// sessão nunca será consolidada eles não passam a valer.
export async function cancelManagementSession(id: string) {
  await prisma.$transaction(async (tx) => {
    // Recepção com animais recebidos não é cancelada: os animais já existem na
    // fazenda; primeiro é preciso removê-los da recepção (o que desfaz o recebimento).
    if (await findReception(tx, id)) {
      const received = await tx.managementParticipant.count({
        where: { managementSessionId: id },
      });
      if (received) {
        throw new StepError(
          `A recepção tem ${received} animal(is) recebido(s). Remova-os antes de cancelar.`,
          409,
        );
      }
    }

    const now = new Date();
    const cancelled = await tx.managementSession.updateMany({
      where: { id, confirmedAt: null, cancelledAt: null },
      data: { cancelledAt: now },
    });
    if (cancelled.count !== 1) {
      throw new StepError(
        "Somente sessões não consolidadas podem ser canceladas.",
        409,
      );
    }

    await tx.animalBatchTransfer.updateMany({
      where: {
        managementSessionId: id,
        confirmedAt: null,
        cancelledAt: null,
      },
      data: { cancelledAt: now },
    });
  });
}

// Inclui na sessão animais que não estavam no planejamento (ex.: apareceram no curral).
// Os que já participam são ignorados. Devolve quantos entraram.
export async function addParticipants(id: string, animalIdsParam: string[]) {
  const animalIds = [...new Set(animalIdsParam)];

  const added = await prisma.$transaction(async (tx) => {
    const session = await requireSessionIn(
      tx,
      id,
      ["planned", "in_progress"],
      "Somente sessões não consolidadas aceitam novos animais.",
    );

    if (await findReception(tx, id)) {
      throw new StepError(
        "Na recepção de compra os animais são criados pelo recebimento, não incluídos da lista.",
        409,
      );
    }

    const invalid = await invalidAnimals(tx, session.propertyId, animalIds);
    if (invalid.length) {
      throw new StepError(invalidAnimalsMessage(invalid), 400, "animalIds");
    }
    await assertNoConflicts(
      tx,
      animalIds,
      sessionIntent(session.steps, false),
      { sessionId: id },
    );

    const created = await tx.managementParticipant.createMany({
      data: animalIds.map((animalId) => ({
        managementSessionId: id,
        animalId,
      })),
      skipDuplicates: true,
    });
    return created.count;
  });
  return { added };
}

// Tira o animal da sessão, desfazendo os registros que ele já tinha. Numa recepção de
// compra, o animal recebido é apagado.
export async function removeParticipant(id: string, animalId: string) {
  await prisma.$transaction(async (tx) => {
    const session = await requireSessionIn(
      tx,
      id,
      ["planned", "in_progress"],
      "Somente sessões não consolidadas podem ser alteradas.",
    );

    for (const step of session.steps) {
      await stepModule(step.type).clear(tx, session, step, animalId);
    }

    const removed = await tx.managementParticipant.deleteMany({
      where: { managementSessionId: id, animalId },
    });
    if (removed.count !== 1) {
      throw new StepError("O animal não participa desta sessão.", 404);
    }

    // Na recepção o animal foi criado aqui: sair da sessão desfaz o recebimento.
    const reception = await findReception(tx, id);
    if (reception) await removeReceivedAnimal(tx, reception, animalId);
  });
}

// Documentos da carga (GTA e nota fiscal) de uma recepção em aberto.
export async function updateReceptionDocuments(
  id: string,
  data: ReceptionDocumentsData,
) {
  await prisma.$transaction(async (tx) => {
    await requireSessionIn(
      tx,
      id,
      ["planned", "in_progress"],
      "A recepção já foi concluída ou cancelada.",
    );
    const updated = await tx.purchaseReception.updateMany({
      where: { managementSessionId: id },
      data,
    });
    if (updated.count !== 1) {
      throw new StepError("Esta sessão não é uma recepção de compra.", 400);
    }
  });
}

// Recebe um animal que desceu do caminhão: cria o animal (ativo, no lote de entrada),
// liga-o à categoria da compra e o inclui na sessão para os manejos da recepção.
export async function receiveSessionAnimal(
  id: string,
  data: z.output<typeof receiveAnimalSchema>,
) {
  const animalId = await prisma.$transaction(async (tx) => {
    const session = requireManagementDate(
      await requireSessionIn(
        tx,
        id,
        ["in_progress"],
        "Inicie a recepção para receber animais.",
      ),
    );
    const reception = await findReception(tx, id);
    if (!reception) {
      throw new StepError("Esta sessão não é uma recepção de compra.", 400);
    }
    return receiveAnimal(tx, session, reception, data);
  });
  return { animalId };
}

// Registra (ou corrige) uma etapa do manejo no animal. Devolve o contexto atualizado do
// animal (ver loadAnimalContext), para a tela seguir sem outra requisição.
export async function saveSessionAnimalStep(
  id: string,
  animalId: string,
  key: string,
  body: unknown,
) {
  await prisma.$transaction((tx) =>
    saveAnimalStep(tx, id, animalId, key, body),
  );
  return loadAnimalContext(prisma, id, animalId);
}

// Desfaz o registro da etapa no animal. Devolve o contexto atualizado, como o anterior.
export async function clearSessionAnimalStep(
  id: string,
  animalId: string,
  key: string,
) {
  await prisma.$transaction((tx) => clearAnimalStep(tx, id, animalId, key));
  return loadAnimalContext(prisma, id, animalId);
}
