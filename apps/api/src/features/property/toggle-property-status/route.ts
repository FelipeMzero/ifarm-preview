import { Hono } from "hono";
import { RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, uuidParam } from "../../../http";
import { requireSession } from "../../../session";
import { togglePropertyStatus } from "./handler";

export const togglePropertyStatusRoute = new Hono();

// Ativa ou desativa a propriedade.
togglePropertyStatusRoute.patch(`/${uuidParam("id")}`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.propriedades);
  if (response) return response;

  try {
    const { id } = c.req.param();
    const data = await togglePropertyStatus(id);
    return c.json({ success: true, data });
  } catch (error) {
    return errorResponse(error);
  }
});
