import { Hono } from "hono";
import { receptionPurchaseQuerySchema, RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse } from "../../../http";
import { requireSession } from "../../../session";
import { listReceptionPurchases } from "./handler";

export const listReceptionPurchasesRoute = new Hono();

// Compras da propriedade vistas pela área de recepções (sem valores).
listReceptionPurchasesRoute.get("/purchases", async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.recepcoes);
  if (response) return response;

  try {
    const query = receptionPurchaseQuerySchema.safeParse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    );
    if (!query.success) {
      return c.json({ message: "Parâmetros inválidos." }, 400);
    }

    return c.json(await listReceptionPurchases(query.data));
  } catch (error) {
    return errorResponse(error);
  }
});
