import { Hono } from "hono";
import { RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, uuidParam } from "../../../http";
import { requireSession } from "../../../session";
import { getPurchase } from "./handler";

export const getPurchaseRoute = new Hono();

getPurchaseRoute.get(`/${uuidParam("id")}`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.compras);
  if (response) return response;

  try {
    const { id } = c.req.param();
    return c.json(await getPurchase(id));
  } catch (error) {
    return errorResponse(error);
  }
});
