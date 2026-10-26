import { Hono } from "hono";
import { RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, uuidParam } from "../../../http";
import { requireSession } from "../../../session";
import { getProperty } from "./handler";

export const getPropertyRoute = new Hono();

getPropertyRoute.get(`/${uuidParam("id")}`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.propriedades);
  if (response) return response;

  try {
    const { id } = c.req.param();
    return c.json(await getProperty(id));
  } catch (error) {
    return errorResponse(error);
  }
});
