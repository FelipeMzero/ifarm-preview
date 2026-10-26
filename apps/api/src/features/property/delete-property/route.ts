import { Hono } from "hono";
import { RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, uuidParam } from "../../../http";
import { requireSession } from "../../../session";
import { deleteProperty } from "./handler";

export const deletePropertyRoute = new Hono();

deletePropertyRoute.delete(`/${uuidParam("id")}`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.propriedades);
  if (response) return response;

  try {
    const { id } = c.req.param();
    await deleteProperty(id);
    return c.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});
