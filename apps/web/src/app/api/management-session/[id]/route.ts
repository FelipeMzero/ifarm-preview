import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { participantStatus } from "@/lib/management-steps";
import { animalLabel, summarize } from "../../batch-transfer/shared";
import { managementSessionApiSchema } from "../schemas";
import {
  applyPlanSteps,
  errorResponse,
  invalidAnimals,
  invalidAnimalsMessage,
  loadSession,
  requireSessionIn,
  StepError,
  toDateOnly,
  validationErrors,
} from "../shared";
import { countDone, describeSteps, loadStepRecords } from "../steps";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  const { id } = await params;

  try {
    const session = await loadSession(prisma, id);
    if (!session) {
      return NextResponse.json(
        { message: "Sessão de manejo não encontrada." },
        { status: 404 },
      );
    }

    const [row, participants, steps, records] = await Promise.all([
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
              neutered: true,
              currentWeight: true,
              currentBatch: { select: { id: true, name: true } },
            },
          },
        },
      }),
      describeSteps(prisma, session, session.steps),
      loadStepRecords(prisma, session, session.steps),
    ]);

    return NextResponse.json({
      id: session.id,
      status: session.status,
      scheduledDate: toDateOnly(session.scheduledDate),
      managementDate: toDateOnly(session.managementDate),
      title: row.title,
      notes: row.notes ?? "",
      propertyId: session.propertyId,
      confirmedAt: row.confirmedAt?.toISOString() ?? null,
      cancelledAt: row.cancelledAt?.toISOString() ?? null,
      updatedAt: row.updatedAt.toISOString(),
      steps,
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
          },
          status: participantStatus(done, steps.length),
          doneKeys,
          lastHandledAt: lastHandledAt?.toISOString() ?? null,
        };
      }),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Ocorreu um erro interno no servidor." },
      { status: 500 },
    );
  }
}

// Altera o planejamento (data prevista, observação, etapas e participantes). Vale
// enquanto a sessão não for consolidada ou cancelada, inclusive durante o registro.
export async function PUT(request: NextRequest, { params }: Params) {
  const { response } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  const { id } = await params;

  try {
    const validation = managementSessionApiSchema.safeParse(
      await request.json(),
    );
    if (!validation.success) return validationErrors(validation.error);

    const data = validation.data;
    const animalIds = [...new Set(data.animalIds)];

    await prisma.$transaction(async (tx) => {
      const session = await requireSessionIn(
        tx,
        id,
        ["planned", "in_progress"],
        "Somente sessões não consolidadas podem ser alteradas.",
      );

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

      const steps = await applyPlanSteps(
        tx,
        session,
        session.steps,
        data.steps,
      );

      await tx.managementSession.update({
        where: { id },
        data: {
          title: data.title,
          scheduledDate: data.scheduledDate,
          notes: data.notes,
          steps,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
