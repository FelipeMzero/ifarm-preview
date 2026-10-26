import { Hono } from "hono";
import { RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, uuidParam } from "../../../http";
import { requireSession } from "../../../session";
import { getAreaOccupancyHistory } from "./handler";

export const getAreaHistoryRoute = new Hono();

// Lotes que ocuparam a área, do mais recente para o mais antigo.
getAreaHistoryRoute.get(`/${uuidParam("id")}/history`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.areas);
  if (response) return response;

  try {
    const { id } = c.req.param();
    return c.json({ data: await getAreaOccupancyHistory(id) });
  } catch (error) {
    return errorResponse(error);
  }
});
