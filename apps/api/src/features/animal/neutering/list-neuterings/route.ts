import { Hono } from "hono";
import { RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, uuidParam } from "../../../../http";
import { requireSession } from "../../../../session";
import { listNeuterings } from "./handler";

export const listNeuteringsRoute = new Hono();

// Castrações válidas (não canceladas), da mais recente para a mais antiga.
listNeuteringsRoute.get(`/${uuidParam("id")}/neuterings`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  try {
    const { id } = c.req.param();
    return c.json(await listNeuterings(id));
  } catch (error) {
    return errorResponse(error);
  }
});
