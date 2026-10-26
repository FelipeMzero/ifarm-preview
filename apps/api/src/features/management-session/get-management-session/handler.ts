import {
  fromLocalDateTime,
  isSessionOpen,
  type ManagementSessionDetail,
} from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { NotFoundError } from "../../../lib/errors";
import { unavailableReason } from "../../animal/rules";
import { describeReception } from "../../purchase/reception";
import { participantStatus } from "../session-steps";
import { loadSession } from "../shared";
import {
  countDone,
  describeSteps,
  loadStepRecords,
  NO_SESSION_VALUES,
  sessionValues,
} from "../steps";

// Sessão com etapas, participantes (andamento e valores registrados) e, numa recepção de
// compra, as categorias e contagens.
export async function getManagementSession(
  id: string,
): Promise<ManagementSessionDetail> {
  const session = await loadSession(prisma, id);
  if (!session) throw new NotFoundError("Sessão de manejo não encontrada.");

  const [row, participants, steps, records, reception] = await Promise.all([
    prisma.managementSession.findUniqueOrThrow({ where: { id } }),
    prisma.managementParticipant.findMany({
      where: { managementSessionId: id },
      orderBy: { id: "asc" },
      include: {
        animal: {
          select: {
            id: true,
            code: true,
            currentTag: true,
            currentRfid: true,
            name: true,
            sex: true,
            status: true,
            currentPropertyId: true,
            neutered: true,
            currentWeight: true,
            currentBatch: { select: { id: true, name: true } },
          },
        },
      },
    }),
    describeSteps(prisma, session, session.steps),
    loadStepRecords(prisma, session, session.steps),
    describeReception(prisma, id),
  ]);

  const open = isSessionOpen(session.status);

  return {
    id: session.id,
    status: session.status,
    scheduledAt: fromLocalDateTime(session.scheduledAt),
    performedAt: session.performedAt
      ? fromLocalDateTime(session.performedAt)
      : null,
    title: row.title,
    notes: row.notes ?? "",
    propertyId: session.propertyId,
    confirmedAt: row.confirmedAt?.toISOString() ?? null,
    cancelledAt: row.cancelledAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
    steps,
    // Preenchido = sessão de recepção de compra (categorias e contagens, sem valores).
    reception,
    participants: participants.map(({ animal, lastHandledAt }) => {
      const doneKeys = steps
        .filter((s) => records.get(s.key)?.has(animal.id))
        .map((s) => s.key);
      const done = countDone(records, animal.id);
      return {
        animal: {
          id: animal.id,
          code: animal.code,
          earTag: animal.currentTag,
          rfid: animal.currentRfid,
          name: animal.name,
          sex: animal.sex,
          status: animal.status,
          neutered: animal.neutered,
          currentWeightKg: animal.currentWeight?.toNumber() ?? null,
          currentBatch: animal.currentBatch,
          // Só com a sessão aberta: depois de encerrada, não há o que remover.
          unavailableReason: open
            ? unavailableReason(animal, session.propertyId)
            : null,
        },
        status: participantStatus(done, steps.length),
        // Só com a sessão aberta: consolidada, os valores já são os atuais (ou foram
        // substituídos depois); cancelada, nunca valeram.
        sessionValues: open
          ? sessionValues(records, animal.id)
          : NO_SESSION_VALUES,
        doneKeys,
        lastHandledAt: lastHandledAt?.toISOString() ?? null,
        categoryId: reception?.categoryOfAnimal[animal.id] ?? null,
      };
    }),
  };
}
