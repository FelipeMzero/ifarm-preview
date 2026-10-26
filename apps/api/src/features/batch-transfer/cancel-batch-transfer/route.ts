import { Hono } from "hono";
import { RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, uuidParam } from "../../../http";
import { requireSession } from "../../../session";
import { cancelBatchTransfer } from "./handler";

export const cancelBatchTransferRoute = new Hono();

// Cancela um plano pendente (o registro é mantido para auditoria).
cancelBatchTransferRoute.post(`/${uuidParam("id")}/cancel`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.lotes);
  if (response) return response;

  try {
    const { id } = c.req.param();
    await cancelBatchTransfer(id);
    return c.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});
