import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { participantStatus } from "@/lib/management-steps";
import { effectiveNeutering, effectiveWeighing } from "../../../effective";
import { loadSession, toDateOnly } from "../../../shared";
import { countDone, describeSteps, loadStepRecords } from "../../../steps";

// Tudo o que as telas de etapa precisam de um animal da sessão: dados atuais do animal,
// etapas da sessão e o que já foi registrado nele.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; animalId: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  const { id, animalId } = await params;

  try {
    const session = await loadSession(prisma, id);
    const participant = session
      ? await prisma.managementParticipant.findUnique({
          where: {
            managementSessionId_animalId: {
              managementSessionId: id,
              animalId,
            },
          },
        })
      : null;

    if (!session || !participant) {
      return NextResponse.json(
        { message: "Animal não encontrado nesta sessão de manejo." },
        { status: 404 },
      );
    }

    const [animal, lastWeighing, lastNeutering, steps, records] =
      await Promise.all([
        prisma.animal.findUniqueOrThrow({
          where: { id: animalId },
          include: { currentBatch: { select: { id: true, name: true } } },
        }),
        prisma.animalWeighing.findFirst({
          where: { animalId, cancelledAt: null, ...effectiveWeighing },
          orderBy: [{ weighedAt: "desc" }, { id: "desc" }],
        }),
        prisma.animalNeutering.findFirst({
          where: { animalId, cancelledAt: null, ...effectiveNeutering },
          orderBy: [{ neuteredAt: "desc" }, { id: "desc" }],
        }),
        describeSteps(prisma, session, session.steps),
        loadStepRecords(prisma, session, session.steps, [animalId]),
      ]);

    return NextResponse.json({
      session: {
        id: session.id,
        status: session.status,
        managementDate: toDateOnly(session.managementDate),
      },
      steps,
      animal: {
        id: animal.id,
        code: animal.code,
        earTag: animal.currentTag,
        rfid: animal.currentRfid,
        name: animal.name,
        sex: animal.sex,
        status: animal.status,
        birthDate: animal.birthDate?.toISOString().slice(0, 10) ?? null,
        neutered: animal.neutered,
        lastNeuteredAt: lastNeutering?.neuteredAt.toISOString() ?? null,
        currentWeightKg: animal.currentWeight?.toNumber() ?? null,
        lastWeighedAt: lastWeighing?.weighedAt.toISOString() ?? null,
        currentBatch: animal.currentBatch,
      },
      records: Object.fromEntries(
        steps.map((s) => [s.key, records.get(s.key)?.get(animalId) ?? null]),
      ),
      status: participantStatus(countDone(records, animalId), steps.length),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Ocorreu um erro interno no servidor." },
      { status: 500 },
    );
  }
}
