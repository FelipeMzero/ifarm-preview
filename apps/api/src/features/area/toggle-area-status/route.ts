import { Hono } from "hono";
import { RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, uuidParam } from "../../../http";
import { requireSession } from "../../../session";
import { toggleAreaStatus } from "./handler";

export const toggleAreaStatusRoute = new Hono();

// Ativa ou desativa a área (recusa desativar área ocupada por lote).
toggleAreaStatusRoute.patch(`/${uuidParam("id")}`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.areas);
  if (response) return response;

  try {
    const { id } = c.req.param();
    const data = await toggleAreaStatus(id);
    return c.json({ success: true, data });
  } catch (error) {
    return errorResponse(error);
  }
});
