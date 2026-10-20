import "server-only";
import {
  animalLabel,
  summarize,
  toLocalDateTime,
  type BatchTransferData,
} from "@ifarm/shared";
import { prisma } from "@/server/db";
import { assertNoConflicts } from "../animal/commitments";
import { getOrAssignCurrentProperty } from "../current-property/queries";
import { BusinessError, NotFoundError, ValidationError } from "../errors";
import { confirmTransferInTx, ConfirmError } from "./confirmTransfer";
import { transferStatus } from "./rules";

// Valida o lote de destino e os animais do plano (ValidationError com o erro no campo). Os animais podem vir de lotes
// diferentes (ou de nenhum), mas precisam estar ativos na propriedade e fora do
// lote de destino — tanto ao salvar quanto na confirmação.
async function validateTransferPlan(params: {
  propertyId: string;
  destinationBatchId: string;
  animalIds: string[];
}) {
  const { propertyId, destinationBatchId, animalIds } = params;

  const destination = await prisma.batch.findFirst({
    where: { id: destinationBatchId, propertyId, closedAt: null },
    select: { id: true },
  });

  if (!destination) {
    throw new ValidationError("Lote de destino inválido.", {
      destinationBatchId:
        "Lote inválido ou inativo para a propriedade selecionada.",
    });
  }

  const uniqueIds = [...new Set(animalIds)];
  if (!uniqueIds.length) return;

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

  if (messages.length) {
    throw new ValidationError("Animais inválidos.", {
      animalIds: messages.join(" "),
    });
  }
}

// Planeja uma transferência (pendente) para a propriedade informada ou a atual do usuário.
export async function createBatchTransfer(
  data: BatchTransferData,
  userId: string,
) {
  const propertyId =
    data.propertyId ?? (await getOrAssignCurrentProperty(userId))?.id;
  if (!propertyId) {
    throw new BusinessError("Nenhuma propriedade selecionada.", 400);
  }

  const animalIds = [...new Set(data.animalIds)];
  await validateTransferPlan({
    propertyId,
    destinationBatchId: data.destinationBatchId,
    animalIds,
  });

  const transfer = await prisma.$transaction(async (tx) => {
    await assertNoConflicts(tx, animalIds, { kind: "transfer" });
    return tx.animalBatchTransfer.create({
      data: {
        transferDate: toLocalDateTime(data.transferDate),
        notes: data.notes,
        destinationBatchId: data.destinationBatchId,
        propertyId,
        items: {
          create: animalIds.map((animalId) => ({ animalId })),
        },
      },
    });
  });
  return { id: transfer.id };
}

const NOT_PENDING = "Somente transferências pendentes podem ser alteradas.";

// Altera um plano pendente que não pertence a uma sessão de manejo.
export async function updateBatchTransfer(id: string, data: BatchTransferData) {
  const current = await prisma.animalBatchTransfer.findUnique({
    where: { id },
    include: { items: { select: { id: true, animalId: true } } },
  });
  if (!current) throw new NotFoundError("Transferência não encontrada.");

  if (current.managementSessionId) {
    throw new BusinessError(
      "Esta transferência faz parte de uma sessão de manejo e só pode ser alterada pela sessão.",
      409,
    );
  }
  if (transferStatus(current) !== "pending") {
    throw new BusinessError(NOT_PENDING, 409);
  }

  const animalIds = [...new Set(data.animalIds)];
  await validateTransferPlan({
    propertyId: current.propertyId,
    destinationBatchId: data.destinationBatchId,
    animalIds,
  });

  // Mantém os itens que continuam no plano (preserva createdAt/notes) e só
  // remove/adiciona a diferença.
  const nextIds = new Set(animalIds);
  const currentIds = new Set(current.items.map((i) => i.animalId));
  const removedItemIds = current.items
    .filter((i) => !nextIds.has(i.animalId))
    .map((i) => i.id);
  const addedAnimalIds = animalIds.filter((a) => !currentIds.has(a));

  await prisma.$transaction(async (tx) => {
    // Condicional ao status para não sobrescrever uma confirmação concorrente.
    const updated = await tx.animalBatchTransfer.updateMany({
      where: { id, confirmedAt: null, cancelledAt: null },
      data: {
        transferDate: toLocalDateTime(data.transferDate),
        notes: data.notes,
        destinationBatchId: data.destinationBatchId,
      },
    });
    if (updated.count !== 1) throw new BusinessError(NOT_PENDING, 409);

    if (removedItemIds.length) {
      await tx.animalBatchTransferItem.deleteMany({
        where: { id: { in: removedItemIds } },
      });
    }

    await assertNoConflicts(
      tx,
      addedAnimalIds,
      { kind: "transfer" },
      { transferId: id },
    );

    if (addedAnimalIds.length) {
      await tx.animalBatchTransferItem.createMany({
        data: addedAnimalIds.map((animalId) => ({
          transferId: id,
          animalId,
        })),
      });
    }
  });
}

// Efetiva o plano (ver confirmTransferInTx). Transferências geradas por uma sessão de
// manejo só são efetivadas pela consolidação da sessão.
export async function confirmBatchTransfer(id: string) {
  await prisma.$transaction(async (tx) => {
    const transfer = await tx.animalBatchTransfer.findUnique({
      where: { id },
      select: {
        managementSessionId: true,
        items: { select: { animalId: true } },
      },
    });
    if (transfer?.managementSessionId) {
      throw new ConfirmError(
        "Esta transferência faz parte de uma sessão de manejo e é efetivada na consolidação da sessão.",
      );
    }
    // Rechecagem: pega conflitos anteriores a esta regra e inclusões simultâneas.
    await assertNoConflicts(
      tx,
      transfer?.items.map((i) => i.animalId) ?? [],
      { kind: "transfer" },
      { transferId: id },
    );
    await confirmTransferInTx(tx, id);
  });
}

// Cancela um plano pendente. O registro é mantido (cancelledAt) para auditoria.
export async function cancelBatchTransfer(id: string) {
  const cancelled = await prisma.animalBatchTransfer.updateMany({
    where: {
      id,
      confirmedAt: null,
      cancelledAt: null,
      managementSessionId: null,
    },
    data: { cancelledAt: new Date() },
  });
  if (cancelled.count !== 1) {
    throw new BusinessError(
      "Somente transferências pendentes (fora de sessões de manejo) podem ser canceladas.",
      409,
    );
  }
}
