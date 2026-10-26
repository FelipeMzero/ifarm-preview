import { Hono } from "hono";
import { RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, uuidParam } from "../../../../http";
import { requireSession } from "../../../../session";
import { listWeighings } from "./handler";

export const listWeighingsRoute = new Hono();

listWeighingsRoute.get(`/${uuidParam("id")}/weighings`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  try {
    const { id } = c.req.param();
    return c.json(await listWeighings(id));
  } catch (error) {
    return errorResponse(error);
  }
});
