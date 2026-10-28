import {
  OPEN_SESSION_STATUSES,
  zonedDateTimeToInstant,
  type ManagementSessionStartData,
} from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { propertyTimeZone } from "../../property/time-zone.public";
import { requireSessionIn, StepError } from "../shared";

// Inicia o registro informando a data em que o manejo acontece. Também serve para
// corrigir essa data enquanto a sessão não for consolidada: os registros recebem a
// data definitiva na consolidação.
export async function startManagementSession(
  id: string,
  data: ManagementSessionStartData,
) {
  await prisma.$transaction(async (tx) => {
    const session = await requireSessionIn(
      tx,
      id,
      OPEN_SESSION_STATUSES,
      "Somente sessões não consolidadas podem ser iniciadas.",
    );

    // A data e hora informadas valem no fuso da propriedade.
    const performedAt = zonedDateTimeToInstant(
      data.performedAt,
      await propertyTimeZone(session.propertyId, tx),
    );
    if (performedAt > new Date()) {
      throw new StepError(
        "A data do manejo não pode ser futura.",
        400,
        "performedAt",
      );
    }

    await tx.managementSession.update({
      where: { id },
      data: { performedAt },
    });
  });
}
