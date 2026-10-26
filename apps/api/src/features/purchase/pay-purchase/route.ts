import { Hono } from "hono";
import { purchasePaymentSchema, RESOURCE_ACCESS } from "@ifarm/shared";
import {
  errorResponse,
  uuidParam,
  validationErrorResponse,
} from "../../../http";
import { requireSession } from "../../../session";
import { payPurchase } from "./handler";

export const payPurchaseRoute = new Hono();

// Registra o pagamento (data informada ou hoje).
payPurchaseRoute.post(`/${uuidParam("id")}/pay`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.compras);
  if (response) return response;

  try {
    const { id } = c.req.param();
    const validation = purchasePaymentSchema.safeParse(
      await c.req.json().catch(() => ({})),
    );
    if (!validation.success) return validationErrorResponse(validation.error);

    await payPurchase(id, validation.data);
    return c.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});
