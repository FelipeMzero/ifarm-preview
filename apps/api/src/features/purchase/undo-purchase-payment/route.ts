import { Hono } from "hono";
import { RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, uuidParam } from "../../../http";
import { requireSession } from "../../../session";
import { undoPurchasePayment } from "./handler";

export const undoPurchasePaymentRoute = new Hono();

// Desfaz o pagamento (correção de um registro feito por engano).
undoPurchasePaymentRoute.delete(`/${uuidParam("id")}/pay`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.compras);
  if (response) return response;

  try {
    const { id } = c.req.param();
    await undoPurchasePayment(id);
    return c.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});
