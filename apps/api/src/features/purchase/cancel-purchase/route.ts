import { Hono } from "hono";
import { RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, uuidParam } from "../../../http";
import { requireSession } from "../../../session";
import { cancelPurchase } from "./handler";

export const cancelPurchaseRoute = new Hono();

// Cancela (desconsidera) uma compra em andamento, sem animais recebidos e não paga.
cancelPurchaseRoute.post(`/${uuidParam("id")}/cancel`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.compras);
  if (response) return response;

  try {
    const { id } = c.req.param();
    await cancelPurchase(id);
    return c.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});
