import { Hono } from "hono";
import {
  createNeuteringTechnique,
  deleteNeuteringTechnique,
  toggleNeuteringTechniqueStatus,
  updateNeuteringTechnique,
} from "@ifarm/domain/neutering-technique/mutations";
import { listNeuteringTechniques } from "@ifarm/domain/neutering-technique/queries";
import { neuteringTechniqueSchema, RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, uuidParam, validationErrorResponse } from "../http";
import { requireSession } from "../session";

export const neuteringTechniqueRoutes = new Hono();

neuteringTechniqueRoutes.get("/", async (c) => {
  const { response } = await requireSession(
    RESOURCE_ACCESS["tecnicas-castracao"],
  );
  if (response) return response;

  try {
    return c.json({ data: await listNeuteringTechniques() });
  } catch (error) {
    return errorResponse(error);
  }
});

neuteringTechniqueRoutes.post("/", async (c) => {
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

neuteringTechniqueRoutes.put(`/${uuidParam("id")}`, async (c) => {
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

neuteringTechniqueRoutes.delete(`/${uuidParam("id")}`, async (c) => {
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

// Ativa ou desativa a técnica de castração.
neuteringTechniqueRoutes.patch(`/${uuidParam("id")}`, async (c) => {
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
