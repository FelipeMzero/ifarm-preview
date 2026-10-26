import { Hono } from "hono";
import { neuteringTechniqueSchema, RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, validationErrorResponse } from "../../../http";
import { requireSession } from "../../../session";
import { createNeuteringTechnique } from "./handler";

export const createNeuteringTechniqueRoute = new Hono();

createNeuteringTechniqueRoute.post("/", async (c) => {
  const { response } = await requireSession(
    RESOURCE_ACCESS["tecnicas-castracao"],
  );
  if (response) return response;

  try {
    const validation = neuteringTechniqueSchema.safeParse(await c.req.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    const data = await createNeuteringTechnique(validation.data);
    return c.json({ success: true, data }, 201);
  } catch (error) {
    return errorResponse(error);
  }
});
