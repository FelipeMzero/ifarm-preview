import { NextRequest, NextResponse } from "next/server";
import { prisma, type Prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import {
  sessionStatus,
  sessionStepsSelect,
  STEP_TYPE_LABELS,
  toSessionSteps,
} from "@/lib/management-steps";
import { assertNoConflicts } from "@/server/animal/commitments";
import { getOrAssignCurrentProperty } from "@/server/current-property/queries";
import {
  managementSessionApiSchema,
  managementSessionQuerySchema,
  type ManagementSessionQueryData,
} from "@/server/management-session/schemas";
import {
  applyPlanSteps,
  invalidAnimals,
  invalidAnimalsMessage,
  sessionIntent,
  StepError,
  toDateOnly,
} from "@/server/management-session/shared";
import { errorResponse, validationErrorResponse } from "@/app/api/http";

function buildWhere(query: ManagementSessionQueryData, propertyId: string) {
  // Recepções de compra ficam na área de recepções, não na lista de manejos.
  const where: Prisma.ManagementSessionWhereInput = {
    propertyId,
    purchaseReception: { is: null },
  };

  if (query.status === "open") {
    where.confirmedAt = null;
    where.cancelledAt = null;
  } else if (query.status === "planned") {
    where.managementDate = null;
    where.confirmedAt = null;
    where.cancelledAt = null;
  } else if (query.status === "in_progress") {
    where.managementDate = { not: null };
    where.confirmedAt = null;
    where.cancelledAt = null;
  } else if (query.status === "confirmed") {
    where.confirmedAt = { not: null };
    where.cancelledAt = null;
  } else if (query.status === "cancelled") {
    where.cancelledAt = { not: null };
  }

  if (query.search) {
    const contains = { contains: query.search, mode: "insensitive" as const };
    where.OR = [{ title: contains }, { notes: contains }];
  }

  return where;
}

export async function GET(request: NextRequest) {
  const { response, session } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  try {
    const { searchParams } = new URL(request.url);
    const query = managementSessionQuerySchema.safeParse(
      Object.fromEntries(searchParams),
    );

    if (!query.success) {
      return NextResponse.json(
        { message: "Parâmetros inválidos." },
        { status: 400 },
      );
    }

    let propertyId = query.data.propertyId;
    if (!propertyId) {
      propertyId = (await getOrAssignCurrentProperty(session.user.id))?.id;
    }

    if (!propertyId) {
      return NextResponse.json({ data: [], total: 0, pageCount: 0 });
    }

    const where = buildWhere(query.data, propertyId);

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
        orderBy: [{ scheduledDate: "desc" }, { createdAt: "desc" }],
        skip: query.data.page * query.data.pageSize,
        take: query.data.pageSize,
      }),
      prisma.managementSession.count({ where }),
    ]);

    return NextResponse.json({
      data: sessions.map((s) => {
        const health = new Map(s.healthManagements.map((h) => [h.id, h]));
        return {
          id: s.id,
          scheduledDate: toDateOnly(s.scheduledDate),
          managementDate: toDateOnly(s.managementDate),
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
      page: query.data.page,
      pageSize: query.data.pageSize,
      pageCount: Math.ceil(total / query.data.pageSize),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Ocorreu um erro interno no servidor." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const { response, session } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  try {
    const validation = managementSessionApiSchema.safeParse(
      await request.json(),
    );
    if (!validation.success) return validationErrorResponse(validation.error);

    const data = validation.data;

    const propertyId =
      data.propertyId ??
      (await getOrAssignCurrentProperty(session.user.id))?.id;
    if (!propertyId) {
      return NextResponse.json(
        { success: false, message: "Nenhuma propriedade selecionada." },
        { status: 400 },
      );
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
          scheduledDate: data.scheduledDate,
          notes: data.notes,
          participants: {
            create: animalIds.map((animalId) => ({ animalId })),
          },
        },
      });

      const steps = await applyPlanSteps(
        tx,
        { ...created, managementDate: null },
        [],
        data.steps,
      );
      await assertNoConflicts(tx, animalIds, sessionIntent(steps, false), {
        sessionId: created.id,
      });
      return created.id;
    });

    return NextResponse.json({ success: true, data: { id } }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
