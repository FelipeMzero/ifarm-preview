import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { stockingPreviewApiSchema } from "../schemas";
import { stockingPreview } from "../stocking";

// Prévia da lotação (UA) da área que vai receber animais. Só informa: nenhuma
// operação é bloqueada por excesso de lotação.
export async function POST(request: NextRequest) {
  const { response } = await requireSession();
  if (response) return response;

  try {
    const body = await request.json();
    const validation = stockingPreviewApiSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Parâmetros inválidos." },
        { status: 400 },
      );
    }

    const { transferId, newAnimals, ...rest } = validation.data;
    let { batchId, animalIds } = rest;

    // Atalho para a confirmação de uma transferência já salva.
    if (transferId) {
      const transfer = await prisma.animalBatchTransfer.findUnique({
        where: { id: transferId },
        select: {
          destinationBatchId: true,
          items: { select: { animalId: true } },
        },
      });
      if (!transfer) {
        return NextResponse.json(
          { message: "Transferência não encontrada." },
          { status: 404 },
        );
      }
      batchId = transfer.destinationBatchId;
      animalIds = transfer.items.map((i) => i.animalId);
    }

    const preview = await stockingPreview({
      areaId: rest.areaId,
      batchId,
      animalIds,
      batchIds: rest.batchIds,
      newAnimals: newAnimals.map((a) => ({
        currentWeight: a.weightKg ?? null,
        birthDate: a.birthDate,
        sex: a.sex,
        neutered: a.neutered,
      })),
    });

    return NextResponse.json({ data: preview });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Ocorreu um erro interno no servidor." },
      { status: 500 },
    );
  }
}
