import { Hono } from "hono";
import { stockingPreviewSchema } from "@ifarm/shared";
import { errorResponse } from "../../../http";
import { requireSession } from "../../../session";
import { previewStocking } from "./handler";

export const previewStockingRoute = new Hono();

// Prévia da lotação (UA) da área que vai receber animais. Só informa: nenhuma
// operação é bloqueada por excesso de lotação.
previewStockingRoute.post("/", async (c) => {
  const { response } = await requireSession();
  if (response) return response;

  try {
    const validation = stockingPreviewSchema.safeParse(await c.req.json());
    if (!validation.success) {
      return c.json({ message: "Parâmetros inválidos." }, 400);
    }

    return c.json({ data: await previewStocking(validation.data) });
  } catch (error) {
    return errorResponse(error);
  }
});
