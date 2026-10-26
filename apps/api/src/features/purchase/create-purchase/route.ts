import { Hono } from "hono";
import { purchaseSchema, RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, validationErrorResponse } from "../../../http";
import { requireSession } from "../../../session";
import { createPurchase } from "./handler";

export const createPurchaseRoute = new Hono();

// Registra a negociação (sem animais; eles são criados nas recepções).
createPurchaseRoute.post("/", async (c) => {
  const { response, session } = await requireSession(RESOURCE_ACCESS.compras);
  if (response) return response;

  try {
    const validation = purchaseSchema.safeParse(await c.req.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    const data = await createPurchase(validation.data, session.user.id);
    return c.json({ success: true, data }, 201);
  } catch (error) {
    return errorResponse(error);
  }
});
