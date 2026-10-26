import { Hono } from "hono";
import { RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, uuidParam } from "../../../http";
import { requireSession } from "../../../session";
import { getAnimalDetails } from "./handler";

export const getAnimalDetailsRoute = new Hono();

// Ficha completa do animal (históricos e compra de origem).
getAnimalDetailsRoute.get(`/${uuidParam("id")}/details`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  try {
    const { id } = c.req.param();
    return c.json(await getAnimalDetails(id));
  } catch (error) {
    return errorResponse(error);
  }
});
