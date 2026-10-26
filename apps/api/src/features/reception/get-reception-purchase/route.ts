import { Hono } from "hono";
import { RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, uuidParam } from "../../../http";
import { requireSession } from "../../../session";
import { getReceptionPurchase } from "./handler";

export const getReceptionPurchaseRoute = new Hono();

// Uma compra vista pela área de recepções (sem valores).
getReceptionPurchaseRoute.get(`/purchases/${uuidParam("id")}`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.recepcoes);
  if (response) return response;

  try {
    const { id } = c.req.param();
    return c.json(await getReceptionPurchase(id));
  } catch (error) {
    return errorResponse(error);
  }
});
