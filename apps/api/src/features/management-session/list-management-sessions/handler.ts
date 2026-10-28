import {
  instantToZonedIso,
  STEP_TYPE_LABELS,
  type ManagementSessionListResult,
  type ManagementSessionQuery,
} from "@ifarm/shared";
import { prisma, type Prisma } from "@ifarm/db";
import { getOrAssignCurrentProperty } from "../../current-property/resolve";
import { propertyTimeZone, toZonedIso } from "../../property/time-zone";
import { SESSION_STATUS_WHERE } from "../rules";
import {
  sessionStatus,
  sessionStepsSelect,
  toSessionSteps,
} from "../session-steps";

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

  const [sessions, total, timeZone] = await Promise.all([
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
    propertyTimeZone(propertyId),
  ]);

  return {
    data: sessions.map((s) => {
      const health = new Map(s.healthManagements.map((h) => [h.id, h]));
      return {
        id: s.id,
        scheduledAt: instantToZonedIso(s.scheduledAt, timeZone),
        performedAt: toZonedIso(s.performedAt, timeZone),
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
        updatedAt: toZonedIso(s.updatedAt, timeZone),
      };
    }),
    total,
    page: query.page,
    pageSize: query.pageSize,
    pageCount: Math.ceil(total / query.pageSize),
  };
}
