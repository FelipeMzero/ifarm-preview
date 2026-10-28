import {
  zonedDateTimeToInstant,
  type ManagementSessionData,
} from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { assertNoConflicts } from "../../animal/commitments";
import { getOrAssignCurrentProperty } from "../../current-property/resolve";
import { propertyTimeZone } from "../../property/time-zone";
import {
  invalidAnimals,
  invalidAnimalsMessage,
  sessionIntent,
  StepError,
} from "../shared";
import { applyPlanSteps } from "../plan";

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
  // A data e hora previstas valem no fuso da propriedade.
  const scheduledAt = zonedDateTimeToInstant(
    data.scheduledAt,
    await propertyTimeZone(propertyId),
  );

  const id = await prisma.$transaction(async (tx) => {
    const invalid = await invalidAnimals(tx, propertyId, animalIds);
    if (invalid.length) {
      throw new StepError(invalidAnimalsMessage(invalid), 400, "animalIds");
    }

    const created = await tx.managementSession.create({
      data: {
        propertyId,
        title: data.title,
        scheduledAt,
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
