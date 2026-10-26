import { Hono } from "hono";
import { RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, uuidParam } from "../../../http";
import { requireSession } from "../../../session";
import { deleteArea } from "./handler";

export const deleteAreaRoute = new Hono();

deleteAreaRoute.delete(`/${uuidParam("id")}`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.areas);
  if (response) return response;

  try {
    const { id } = c.req.param();
    await deleteArea(id);
    return c.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});
