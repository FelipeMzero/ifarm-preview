import type { ManagementSessionQuery } from "@ifarm/shared";
import {
  fromLocalDateTime,
  isSessionOpen,
  STEP_TYPE_LABELS,
  type ManagementOptions,
  type ManagementSessionDetail,
  type ManagementSessionListResult,
  type SessionAnimalContext,
} from "@ifarm/shared";
import { prisma, type Prisma } from "@ifarm/db";
import { getOrAssignCurrentProperty } from "@ifarm/domain/current-property/queries";
import { NotFoundError } from "@ifarm/domain/errors";
import { describeReception } from "../purchase/reception";
import { loadAnimalContext } from "./animalContext";
import { SESSION_STATUS_WHERE } from "./rules";
import { loadSession } from "./shared";
import {
  countDone,
  describeSteps,
  loadStepRecords,
  NO_SESSION_VALUES,
  sessionValues,
} from "./steps";
import {
  participantStatus,
  sessionStatus,
  sessionStepsSelect,
  toSessionSteps,
} from "./session-steps";
import { unavailableReason } from "../animal/rules";

function buildWhere(query: ManagementSessionQuery, propertyId: string) {
  // Recepções de compra ficam na área de recepções, não na lista de manejos.
  const where: Prisma.ManagementSessionWhereInput = {
    propertyId,
    purchaseReception: { is: null },
  };

  if (query.status) Object.assign(where, SESSION_STATUS_WHERE[query.status]);

  if (query.search) {
    const contains = { contains: query.search, mode: "insensitive" as const };
    where.OR = [{ title: contains }, { notes: contains }];
  }

  return where;
}

// Sessões da propriedade informada ou, sem ela, da propriedade atual do usuário.
export async function listManagementSessions(
  query: ManagementSessionQuery,
  userId: string,
): Promise<ManagementSessionListResult> {
  const propertyId =
    query.propertyId ?? (await getOrAssignCurrentProperty(userId))?.id;
  if (!propertyId) return { data: [], total: 0, pageCount: 0 };

  const where = buildWhere(query, propertyId);

  const [sessions, total] = await Promise.all([
    prisma.managementSession.findMany({
      where,
      include: {
        steps: sessionStepsSelect,
        healthManagements: {
          select: { id: true, title: true, type: { select: { name: true } } },
        },
        _count: {
          select: {
            participants: true,
          },
        },
        participants: {
          where: { lastHandledAt: { not: null } },
          select: { id: true },
        },
      },
      orderBy: [{ scheduledAt: "desc" }, { createdAt: "desc" }],
      skip: query.page * query.pageSize,
      take: query.pageSize,
    }),
    prisma.managementSession.count({ where }),
  ]);

  return {
    data: sessions.map((s) => {
      const health = new Map(s.healthManagements.map((h) => [h.id, h]));
      return {
        id: s.id,
        scheduledAt: fromLocalDateTime(s.scheduledAt),
        performedAt: s.performedAt ? fromLocalDateTime(s.performedAt) : null,
        title: s.title,
        notes: s.notes,
        steps: toSessionSteps(s.steps).map((step) => {
          if (step.type !== "health") return STEP_TYPE_LABELS[step.type];
          const h = health.get(step.healthManagementId);
          return h?.title ?? h?.type.name ?? STEP_TYPE_LABELS.health;
        }),
        animalCount: s._count.participants,
        handledCount: s.participants.length,
        status: sessionStatus(s),
        updatedAt: s.updatedAt.toISOString(),
      };
    }),
    total,
    page: query.page,
    pageSize: query.pageSize,
    pageCount: Math.ceil(total / query.pageSize),
  };
}

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

// Opções usadas no planejamento e no registro: tipos de procedimento sanitário,
// técnicas de castração, pessoas (veterinário responsável) e lotes ativos da
// propriedade (apartação).
export async function getManagementOptions(
  propertyIdParam: string | null,
  userId: string,
): Promise<ManagementOptions> {
  const propertyId =
    propertyIdParam || (await getOrAssignCurrentProperty(userId))?.id;

  const [healthTypes, neuteringTechniques, people, batches] = await Promise.all(
    [
      prisma.healthManagementType.findMany({
        where: { deactivatedAt: null },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.neuteringTechnique.findMany({
        where: { deactivatedAt: null },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.person.findMany({
        where: { deactivatedAt: null },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      propertyId
        ? prisma.batch.findMany({
            where: { propertyId, closedAt: null },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
          })
        : [],
    ],
  );

  return { healthTypes, neuteringTechniques, people, batches };
}

// Tudo o que as telas de etapa precisam de um animal da sessão (ver loadAnimalContext).
export async function getSessionAnimal(
  id: string,
  animalId: string,
): Promise<SessionAnimalContext> {
  const context = await loadAnimalContext(prisma, id, animalId);
  if (!context) {
    throw new NotFoundError("Animal não encontrado nesta sessão de manejo.");
  }
  return context;
}
