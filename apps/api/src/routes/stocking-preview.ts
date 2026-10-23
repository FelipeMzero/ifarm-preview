import { Hono } from "hono";
import { toDbDate } from "@ifarm/domain/db-dates";
import {
  stockingPreview,
  transferStockingPreview,
} from "@ifarm/domain/stocking/queries";
import { stockingPreviewSchema } from "@ifarm/shared";
import { errorResponse } from "../http";
import { requireSession } from "../session";

export const stockingPreviewRoutes = new Hono();

// Prévia da lotação (UA) da área que vai receber animais. Só informa: nenhuma
// operação é bloqueada por excesso de lotação.
stockingPreviewRoutes.post("/", async (c) => {
  const { response } = await requireSession();
  if (response) return response;

  try {
    const validation = stockingPreviewSchema.safeParse(await c.req.json());
    if (!validation.success) {
      return c.json({ message: "Parâmetros inválidos." }, 400);
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

    return c.json({ data });
  } catch (error) {
    return errorResponse(error);
  }
});
