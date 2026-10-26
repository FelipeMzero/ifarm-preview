import { Hono } from "hono";
import { areaSchema, RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, validationErrorResponse } from "../../../http";
import { requireSession } from "../../../session";
import { createArea } from "./handler";

export const createAreaRoute = new Hono();

createAreaRoute.post("/", async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.areas);
  if (response) return response;

  try {
    const validation = areaSchema.safeParse(await c.req.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    const data = await createArea(validation.data);
    return c.json({ success: true, data }, 201);
  } catch (error) {
    return errorResponse(error);
  }
});
