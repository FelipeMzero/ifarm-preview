import { Hono } from "hono";
import { RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, uuidParam } from "../../../http";
import { requireSession } from "../../../session";
import { consolidatePurchase } from "./handler";

export const consolidatePurchaseRoute = new Hono();

// Consolida a compra: rateia o custo de cada animal e encerra o processo.
consolidatePurchaseRoute.post(`/${uuidParam("id")}/consolidate`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.compras);
  if (response) return response;

  try {
    const { id } = c.req.param();
    await consolidatePurchase(id);
    return c.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});
