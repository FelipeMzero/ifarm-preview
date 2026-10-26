import { Hono } from "hono";
import { RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, uuidParam } from "../../../http";
import { requireSession } from "../../../session";
import { getBatchDetails } from "./handler";

export const getBatchDetailsRoute = new Hono();

// Painel do lote (animais, indicadores, movimentações, transferências e compras).
getBatchDetailsRoute.get(`/${uuidParam("id")}/details`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.lotes);
  if (response) return response;

  try {
    const { id } = c.req.param();
    return c.json(await getBatchDetails(id));
  } catch (error) {
    return errorResponse(error);
  }
});
