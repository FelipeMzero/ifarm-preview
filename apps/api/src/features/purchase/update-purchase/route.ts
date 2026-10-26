import { Hono } from "hono";
import { purchaseSchema, RESOURCE_ACCESS } from "@ifarm/shared";
import {
  errorResponse,
  uuidParam,
  validationErrorResponse,
} from "../../../http";
import { requireSession } from "../../../session";
import { updatePurchase } from "./handler";

export const updatePurchaseRoute = new Hono();

// Altera a negociação enquanto a compra está em andamento.
updatePurchaseRoute.put(`/${uuidParam("id")}`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.compras);
  if (response) return response;

  try {
    const { id } = c.req.param();
    const validation = purchaseSchema.safeParse(await c.req.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    await updatePurchase(id, validation.data);
    return c.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});
