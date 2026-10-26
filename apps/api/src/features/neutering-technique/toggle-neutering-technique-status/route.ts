import { Hono } from "hono";
import { RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, uuidParam } from "../../../http";
import { requireSession } from "../../../session";
import { toggleNeuteringTechniqueStatus } from "./handler";

export const toggleNeuteringTechniqueStatusRoute = new Hono();

// Ativa ou desativa a técnica de castração.
toggleNeuteringTechniqueStatusRoute.patch(`/${uuidParam("id")}`, async (c) => {
  const { response } = await requireSession(
    RESOURCE_ACCESS["tecnicas-castracao"],
  );
  if (response) return response;

  try {
    const { id } = c.req.param();
    const data = await toggleNeuteringTechniqueStatus(id);
    return c.json({ success: true, data });
  } catch (error) {
    return errorResponse(error);
  }
});
