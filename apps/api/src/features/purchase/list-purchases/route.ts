import { Hono } from "hono";
import { purchaseQuerySchema, RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse } from "../../../http";
import { requireSession } from "../../../session";
import { listPurchases } from "./handler";

export const listPurchasesRoute = new Hono();

listPurchasesRoute.get("/", async (c) => {
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
