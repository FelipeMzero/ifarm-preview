import { Hono } from "hono";
import { RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, uuidParam } from "../../../http";
import { requireSession } from "../../../session";
import { closeBatch } from "./handler";

export const closeBatchRoute = new Hono();

// Encerra um lote vazio e libera a área que ele ocupava.
closeBatchRoute.post(`/${uuidParam("id")}/close`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.lotes);
  if (response) return response;

  try {
    const { id } = c.req.param();
    await closeBatch(id);
    return c.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});
