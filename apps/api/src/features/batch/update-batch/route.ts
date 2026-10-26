import { Hono } from "hono";
import { batchUpdateSchema, RESOURCE_ACCESS } from "@ifarm/shared";
import {
  errorResponse,
  uuidParam,
  validationErrorResponse,
} from "../../../http";
import { requireSession } from "../../../session";
import { updateBatch } from "./handler";

export const updateBatchRoute = new Hono();

updateBatchRoute.put(`/${uuidParam("id")}`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.lotes);
  if (response) return response;

  try {
    const { id } = c.req.param();
    const validation = batchUpdateSchema.safeParse(await c.req.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    await updateBatch(id, validation.data);
    return c.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});
