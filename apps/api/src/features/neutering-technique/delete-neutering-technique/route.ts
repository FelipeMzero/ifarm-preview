import { Hono } from "hono";
import { RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, uuidParam } from "../../../http";
import { requireSession } from "../../../session";
import { deleteNeuteringTechnique } from "./handler";

export const deleteNeuteringTechniqueRoute = new Hono();

deleteNeuteringTechniqueRoute.delete(`/${uuidParam("id")}`, async (c) => {
  const { response } = await requireSession(
    RESOURCE_ACCESS["tecnicas-castracao"],
  );
  if (response) return response;

  try {
    const { id } = c.req.param();
    await deleteNeuteringTechnique(id);
    return c.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});
