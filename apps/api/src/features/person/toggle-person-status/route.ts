import { Hono } from "hono";
import { RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, uuidParam } from "../../../http";
import { requireSession } from "../../../session";
import { togglePersonStatus } from "./handler";

export const togglePersonStatusRoute = new Hono();

// Ativa ou desativa a pessoa.
togglePersonStatusRoute.patch(`/${uuidParam("id")}`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.pessoas);
  if (response) return response;

  try {
    const { id } = c.req.param();
    const data = await togglePersonStatus(id);
    return c.json({ success: true, data });
  } catch (error) {
    return errorResponse(error);
  }
});
