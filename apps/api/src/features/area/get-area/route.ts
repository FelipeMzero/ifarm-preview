import { Hono } from "hono";
import { RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, uuidParam } from "../../../http";
import { requireSession } from "../../../session";
import { getArea } from "./handler";

export const getAreaRoute = new Hono();

getAreaRoute.get(`/${uuidParam("id")}`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.areas);
  if (response) return response;

  try {
    const { id } = c.req.param();
    return c.json(await getArea(id));
  } catch (error) {
    return errorResponse(error);
  }
});
