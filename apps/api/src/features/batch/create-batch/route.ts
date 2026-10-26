import { Hono } from "hono";
import { batchCreateSchema, RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, validationErrorResponse } from "../../../http";
import { requireSession } from "../../../session";
import { createBatch } from "./handler";

export const createBatchRoute = new Hono();

createBatchRoute.post("/", async (c) => {
  const { response, session } = await requireSession(RESOURCE_ACCESS.lotes);
  if (response) return response;

  try {
    const validation = batchCreateSchema.safeParse(await c.req.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    const data = await createBatch(validation.data, session.user.id);
    return c.json({ success: true, data }, 201);
  } catch (error) {
    return errorResponse(error);
  }
});
