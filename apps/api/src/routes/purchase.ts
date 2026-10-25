import { Hono } from "hono";
import {
  cancelPurchase,
  consolidatePurchase,
  createPurchase,
  payPurchase,
  undoPurchasePayment,
  updatePurchase,
} from "@ifarm/domain/purchase/mutations";
import { getPurchase, listPurchases } from "@ifarm/domain/purchase/queries";
import {
  purchasePaymentSchema,
  purchaseQuerySchema,
  purchaseSchema,
  RESOURCE_ACCESS,
} from "@ifarm/shared";
import { errorResponse, uuidParam, validationErrorResponse } from "../http";
import { requireSession } from "../session";

export const purchaseRoutes = new Hono();

purchaseRoutes.get("/", async (c) => {
  const { response, session } = await requireSession(RESOURCE_ACCESS.compras);
  if (response) return response;

  try {
    const { searchParams } = new URL(c.req.url);
    const query = purchaseQuerySchema.safeParse(
      Object.fromEntries(searchParams),
    );
    if (!query.success) {
      return c.json({ message: "Parâmetros inválidos." }, 400);
    }

    return c.json(await listPurchases(query.data, session.user.id));
  } catch (error) {
    return errorResponse(error);
  }
});

// Registra a negociação (sem animais; eles são criados nas recepções).
purchaseRoutes.post("/", async (c) => {
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

purchaseRoutes.get(`/${uuidParam("id")}`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.compras);
  if (response) return response;

  try {
    const { id } = c.req.param();
    return c.json(await getPurchase(id));
  } catch (error) {
    return errorResponse(error);
  }
});

// Altera a negociação enquanto a compra está em andamento.
purchaseRoutes.put(`/${uuidParam("id")}`, async (c) => {
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

// Cancela (desconsidera) uma compra em andamento, sem animais recebidos e não paga.
purchaseRoutes.post(`/${uuidParam("id")}/cancel`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.compras);
  if (response) return response;

  try {
    const { id } = c.req.param();
    await cancelPurchase(id);
    return c.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});

// Consolida a compra: rateia o custo de cada animal e encerra o processo.
purchaseRoutes.post(`/${uuidParam("id")}/consolidate`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.compras);
  if (response) return response;

  try {
    const { id } = c.req.param();
    await consolidatePurchase(id);
    return c.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});

// Registra o pagamento (data informada ou hoje).
purchaseRoutes.post(`/${uuidParam("id")}/pay`, async (c) => {
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

// Desfaz o pagamento (correção de um registro feito por engano).
purchaseRoutes.delete(`/${uuidParam("id")}/pay`, async (c) => {
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
