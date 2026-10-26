import { Hono } from "hono";
import { batchReopenSchema, RESOURCE_ACCESS } from "@ifarm/shared";
import {
  errorResponse,
  uuidParam,
  validationErrorResponse,
} from "../../../http";
import { requireSession } from "../../../session";
import { reopenBatch } from "./handler";

export const reopenBatchRoute = new Hono();

// Reativa um lote encerrado numa área livre.
reopenBatchRoute.post(`/${uuidParam("id")}/reopen`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.lotes);
  if (response) return response;

  try {
    const { id } = c.req.param();
    const validation = batchReopenSchema.safeParse(await c.req.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    await reopenBatch(id, validation.data);
    return c.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});
