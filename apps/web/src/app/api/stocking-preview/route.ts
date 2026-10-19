import { NextRequest, NextResponse } from "next/server";
import { stockingPreviewSchema, toDbDate } from "@ifarm/shared";
import { requireSession } from "@/app/api/session";
import {
  stockingPreview,
  transferStockingPreview,
} from "@/server/stocking/queries";
import { errorResponse } from "../http";

// Prévia da lotação (UA) da área que vai receber animais. Só informa: nenhuma
// operação é bloqueada por excesso de lotação.
export async function POST(request: NextRequest) {
  const { response } = await requireSession();
  if (response) return response;

  try {
    const validation = stockingPreviewSchema.safeParse(await request.json());
    if (!validation.success) {
      return NextResponse.json(
        { message: "Parâmetros inválidos." },
        { status: 400 },
      );
    }

    const { transferId, newAnimals, ...rest } = validation.data;
    const data = transferId
      ? await transferStockingPreview(transferId)
      : await stockingPreview({
          ...rest,
          newAnimals: newAnimals.map((a) => ({
            currentWeight: a.weightKg ?? null,
            birthDate: a.birthDate ? toDbDate(a.birthDate) : null,
            sex: a.sex,
            neutered: a.neutered,
          })),
        });

    return NextResponse.json({ data });
  } catch (error) {
    return errorResponse(error);
  }
}
