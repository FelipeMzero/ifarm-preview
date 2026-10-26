import { Hono } from "hono";
import { RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, uuidParam } from "../../../http";
import { requireSession } from "../../../session";
import { toggleBreedStatus } from "./handler";

export const toggleBreedStatusRoute = new Hono();

// Ativa ou desativa a raça.
toggleBreedStatusRoute.patch(`/${uuidParam("id")}`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.racas);
  if (response) return response;

  try {
    const { id } = c.req.param();
    const data = await toggleBreedStatus(id);
    return c.json({ success: true, data });
  } catch (error) {
    return errorResponse(error);
  }
});
