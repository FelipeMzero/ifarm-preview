import { prisma } from "@/lib/prisma";

export type BatchTransferStatus = "pending" | "confirmed" | "cancelled";

export function transferStatus(t: {
  confirmedAt: Date | null;
  cancelledAt: Date | null;
}): BatchTransferStatus {
  if (t.cancelledAt) return "cancelled";
  if (t.confirmedAt) return "confirmed";
  return "pending";
}

// Identificação legível do animal em mensagens de erro (brinco → RFID → ID).
export function animalLabel(a: {
  code: number;
  currentTag: string | null;
  currentRfid: string | null;
}) {
  if (a.currentTag) return `brinco ${a.currentTag}`;
  if (a.currentRfid) return `RFID ${a.currentRfid}`;
  return `ID ${a.code}`;
}

export function summarize(labels: string[], max = 5) {
  const shown = labels.slice(0, max).join(", ");
  return labels.length > max ? `${shown} e mais ${labels.length - max}` : shown;
}

// Valida o lote de destino e os animais do plano. Os animais podem vir de lotes
// diferentes (ou de nenhum), mas precisam estar ativos na propriedade e fora do
// lote de destino — tanto ao salvar quanto na confirmação.
export async function validateTransferPlan(params: {
  propertyId: string;
  destinationBatchId: string;
  animalIds: string[];
}): Promise<Record<string, string> | null> {
  const { propertyId, destinationBatchId, animalIds } = params;

  const destination = await prisma.batch.findFirst({
    where: { id: destinationBatchId, propertyId, closedAt: null },
    select: { id: true },
  });

  if (!destination) {
    return {
      destinationBatchId:
        "Lote inválido ou inativo para a propriedade selecionada.",
    };
  }

  const uniqueIds = [...new Set(animalIds)];
  if (!uniqueIds.length) return null;

  const animals = await prisma.animal.findMany({
    where: { id: { in: uniqueIds } },
    select: {
      id: true,
      code: true,
      currentTag: true,
      currentRfid: true,
      status: true,
      currentPropertyId: true,
      currentBatchId: true,
    },
  });
  const found = new Map(animals.map((a) => [a.id, a]));

  const inactive: string[] = [];
  const alreadyInDestination: string[] = [];
  for (const id of uniqueIds) {
    const a = found.get(id);
    if (!a || a.status !== "ACTIVE" || a.currentPropertyId !== propertyId) {
      inactive.push(a ? animalLabel(a) : "desconhecido");
    } else if (a.currentBatchId === destinationBatchId) {
      alreadyInDestination.push(animalLabel(a));
    }
  }

  const messages: string[] = [];
  if (inactive.length) {
    messages.push(
      `Animais que não estão ativos na propriedade: ${summarize(inactive)}.`,
    );
  }
  if (alreadyInDestination.length) {
    messages.push(
      `Animais que já estão no lote de destino: ${summarize(alreadyInDestination)}.`,
    );
  }

  return messages.length ? { animalIds: messages.join(" ") } : null;
}
