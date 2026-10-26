import type { stockingPreviewSchema } from "@ifarm/shared";
import type { z } from "zod";
import { prisma } from "@ifarm/db";
import { toDbDate } from "@ifarm/domain/db-dates";
import { NotFoundError } from "@ifarm/domain/errors";
import { stockingPreview } from "../stocking";

// Prévia da lotação da área que vai receber animais: de uma transferência já salva ou do que
// o formulário descreve (área ou lote, animais, lotes inteiros e animais novos).
export async function previewStocking({
  transferId,
  newAnimals,
  ...rest
}: z.output<typeof stockingPreviewSchema>) {
  if (transferId) return transferStockingPreview(transferId);

  return stockingPreview({
    ...rest,
    newAnimals: newAnimals.map((a) => ({
      currentWeight: a.weightKg ?? null,
      birthDate: a.birthDate ? toDbDate(a.birthDate) : null,
      sex: a.sex,
      neutered: a.neutered,
    })),
  });
}

// Para a confirmação de uma transferência já salva: área do lote de destino e animais da
// transferência.
async function transferStockingPreview(transferId: string) {
  const transfer = await prisma.animalBatchTransfer.findUnique({
    where: { id: transferId },
    select: {
      destinationBatchId: true,
      items: { select: { animalId: true } },
    },
  });
  if (!transfer) throw new NotFoundError("Transferência não encontrada.");

  return stockingPreview({
    batchId: transfer.destinationBatchId,
    animalIds: transfer.items.map((i) => i.animalId),
  });
}
