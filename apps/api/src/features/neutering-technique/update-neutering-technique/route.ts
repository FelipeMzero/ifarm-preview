import { Hono } from "hono";
import { neuteringTechniqueSchema, RESOURCE_ACCESS } from "@ifarm/shared";
import {
  errorResponse,
  uuidParam,
  validationErrorResponse,
} from "../../../http";
import { requireSession } from "../../../session";
import { updateNeuteringTechnique } from "./handler";

export const updateNeuteringTechniqueRoute = new Hono();

updateNeuteringTechniqueRoute.put(`/${uuidParam("id")}`, async (c) => {
  const { response } = await requireSession(
    RESOURCE_ACCESS["tecnicas-castracao"],
  );
  if (response) return response;

  try {
    const { id } = c.req.param();
    const validation = neuteringTechniqueSchema.safeParse(await c.req.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    const data = await updateNeuteringTechnique(id, validation.data);
    return c.json({ success: true, data });
  } catch (error) {
    return errorResponse(error);
  }
});
