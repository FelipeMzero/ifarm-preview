import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { animalLabel, summarize, transferStatus } from "../../shared";

class ConfirmError extends Error {
  constructor(
    message: string,
    public status = 409,
  ) {
    super(message);
  }
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Efetiva o plano: registra o lote de origem de cada item, fecha o histórico ativo de
// cada animal, abre um novo no lote de destino e sincroniza Animal.currentBatchId.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession(RESOURCE_ACCESS.lotes);
  if (response) return response;

  const { id } = await params;

  try {
    await prisma.$transaction(async (tx) => {
      const transfer = await tx.animalBatchTransfer.findUnique({
        where: { id },
        include: {
          destinationBatch: { select: { closedAt: true } },
          items: {
            include: {
              animal: {
                select: {
                  id: true,
                  code: true,
                  currentTag: true,
                  currentRfid: true,
                  status: true,
                  currentBatchId: true,
                  currentPropertyId: true,
                },
              },
            },
          },
        },
      });

      if (!transfer) {
        throw new ConfirmError("Transferência não encontrada.", 404);
      }

      if (transferStatus(transfer) !== "pending") {
        throw new ConfirmError(
          "Somente transferências pendentes podem ser confirmadas.",
        );
      }

      if (transfer.items.length === 0) {
        throw new ConfirmError(
          "Adicione ao menos um animal antes de confirmar a transferência.",
        );
      }

      if (transfer.destinationBatch.closedAt) {
        throw new ConfirmError("O lote de destino está encerrado.");
      }

      const now = new Date();
      const today = startOfDay(now);
      if (transfer.transferDate > today) {
        throw new ConfirmError(
          "A data da transferência é futura. Ajuste a data para confirmar.",
        );
      }

      // Transferência datada de hoje usa o horário da confirmação, para não
      // terminar antes de uma entrada no lote atual ocorrida mais cedo no dia.
      const effectiveAt =
        transfer.transferDate.getTime() === today.getTime()
          ? now
          : transfer.transferDate;

      const inactive = transfer.items.filter(
        ({ animal }) =>
          animal.status !== "ACTIVE" ||
          animal.currentPropertyId !== transfer.propertyId,
      );
      if (inactive.length) {
        throw new ConfirmError(
          `Animais que não estão mais ativos na propriedade: ${summarize(
            inactive.map(({ animal }) => animalLabel(animal)),
          )}. Remova-os da transferência antes de confirmar.`,
        );
      }

      const alreadyInDestination = transfer.items.filter(
        ({ animal }) => animal.currentBatchId === transfer.destinationBatchId,
      );
      if (alreadyInDestination.length) {
        throw new ConfirmError(
          `Animais que já estão no lote de destino: ${summarize(
            alreadyInDestination.map(({ animal }) => animalLabel(animal)),
          )}. Remova-os da transferência antes de confirmar.`,
        );
      }

      const animalIds = transfer.items.map((i) => i.animalId);
      const activeHistories = await tx.animalBatchHistory.findMany({
        where: { animalId: { in: animalIds }, exitedAt: null },
      });

      const enteredLater = activeHistories.filter(
        (h) => h.enteredAt > effectiveAt,
      );
      if (enteredLater.length) {
        const byId = new Map(transfer.items.map((i) => [i.animalId, i.animal]));
        throw new ConfirmError(
          `A data da transferência é anterior à entrada no lote atual de: ${summarize(
            enteredLater.map((h) => animalLabel(byId.get(h.animalId)!)),
          )}.`,
        );
      }

      // Condicional ao status para não confirmar duas vezes em requisições simultâneas.
      const confirmed = await tx.animalBatchTransfer.updateMany({
        where: { id, confirmedAt: null, cancelledAt: null },
        data: { confirmedAt: now },
      });
      if (confirmed.count !== 1) {
        throw new ConfirmError(
          "Somente transferências pendentes podem ser confirmadas.",
        );
      }

      // Registra de qual lote cada animal saiu (agrupado para uma escrita por lote).
      const itemsByOrigin = new Map<string | null, number[]>();
      for (const item of transfer.items) {
        const origin = item.animal.currentBatchId;
        itemsByOrigin.set(origin, [
          ...(itemsByOrigin.get(origin) ?? []),
          item.id,
        ]);
      }
      for (const [originBatchId, itemIds] of itemsByOrigin) {
        await tx.animalBatchTransferItem.updateMany({
          where: { id: { in: itemIds } },
          data: { originBatchId },
        });
      }

      if (activeHistories.length) {
        await tx.animalBatchHistory.updateMany({
          where: { id: { in: activeHistories.map((h) => h.id) } },
          data: { exitedAt: effectiveAt },
        });
      }

      await tx.animalBatchHistory.createMany({
        data: transfer.items.map((item) => ({
          animalId: item.animalId,
          batchId: transfer.destinationBatchId,
          enteredAt: effectiveAt,
          notes: item.notes ?? transfer.notes,
        })),
      });

      await tx.animal.updateMany({
        where: { id: { in: animalIds } },
        data: { currentBatchId: transfer.destinationBatchId },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ConfirmError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.status },
      );
    }

    console.error(error);
    return NextResponse.json(
      { success: false, message: "Ocorreu um erro interno no servidor." },
      { status: 500 },
    );
  }
}
