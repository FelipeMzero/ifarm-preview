import { Hono } from "hono";
import { RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, uuidParam } from "../../../http";
import { requireSession } from "../../../session";
import { deletePerson } from "./handler";

export const deletePersonRoute = new Hono();

deletePersonRoute.delete(`/${uuidParam("id")}`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.pessoas);
  if (response) return response;

  try {
    const { id } = c.req.param();
    await deletePerson(id);
    return c.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});
