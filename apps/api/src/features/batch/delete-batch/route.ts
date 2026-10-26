import { Hono } from "hono";
import { RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, uuidParam } from "../../../http";
import { requireSession } from "../../../session";
import { deleteBatch } from "./handler";

export const deleteBatchRoute = new Hono();

deleteBatchRoute.delete(`/${uuidParam("id")}`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.lotes);
  if (response) return response;

  try {
    const { id } = c.req.param();
    await deleteBatch(id);
    return c.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});
