import { Hono } from "hono";
import { RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, uuidParam } from "../../../http";
import { requireSession } from "../../../session";
import { getPerson } from "./handler";

export const getPersonRoute = new Hono();

getPersonRoute.get(`/${uuidParam("id")}`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.pessoas);
  if (response) return response;

  try {
    const { id } = c.req.param();
    return c.json(await getPerson(id));
  } catch (error) {
    return errorResponse(error);
  }
});
