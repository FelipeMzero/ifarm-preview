import { Hono } from "hono";
import { RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, uuidParam } from "../../../http";
import { requireSession } from "../../../session";
import { confirmBatchTransfer } from "./handler";

export const confirmBatchTransferRoute = new Hono();

// Efetiva o plano: os animais passam para o lote de destino.
confirmBatchTransferRoute.post(`/${uuidParam("id")}/confirm`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.lotes);
  if (response) return response;

  try {
    const { id } = c.req.param();
    await confirmBatchTransfer(id);
    return c.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});
