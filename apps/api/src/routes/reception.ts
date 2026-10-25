import { Hono } from "hono";
import { createReception } from "@ifarm/domain/reception/mutations";
import {
  getReceptionPurchase,
  listReceptionPurchases,
} from "@ifarm/domain/reception/queries";
import {
  createReceptionSchema,
  receptionPurchaseQuerySchema,
  RESOURCE_ACCESS,
} from "@ifarm/shared";
import { errorResponse, uuidParam, validationErrorResponse } from "../http";
import { requireSession } from "../session";

export const receptionRoutes = new Hono();

// Compras da propriedade vistas pela área de recepções (sem valores).
receptionRoutes.get("/purchases", async (c) => {
  const { response, session } = await requireSession(RESOURCE_ACCESS.recepcoes);
  if (response) return response;

  try {
    const query = receptionPurchaseQuerySchema.safeParse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    );
    if (!query.success) {
      return c.json({ message: "Parâmetros inválidos." }, 400);
    }

    return c.json(await listReceptionPurchases(query.data, session.user.id));
  } catch (error) {
    return errorResponse(error);
  }
});

// Uma compra vista pela área de recepções (sem valores).
receptionRoutes.get(`/purchases/${uuidParam("id")}`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.recepcoes);
  if (response) return response;

  try {
    const { id } = c.req.param();
    return c.json(await getReceptionPurchase(id));
  } catch (error) {
    return errorResponse(error);
  }
});

// "Receber animais": abre uma recepção (viagem) da compra.
receptionRoutes.post(`/purchases/${uuidParam("id")}/receptions`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.recepcoes);
  if (response) return response;

  try {
    const { id } = c.req.param();
    const validation = createReceptionSchema.safeParse(
      await c.req.json().catch(() => ({})),
    );
    if (!validation.success) return validationErrorResponse(validation.error);

    const data = await createReception(id, validation.data);
    return c.json({ success: true, data }, 201);
  } catch (error) {
    return errorResponse(error);
  }
});
