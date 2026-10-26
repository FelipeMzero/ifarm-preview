import { Hono } from "hono";
import { RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, uuidParam } from "../../../http";
import { requireSession } from "../../../session";
import { getManagementSession } from "./handler";

export const getManagementSessionRoute = new Hono();

getManagementSessionRoute.get(`/${uuidParam("id")}`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.manejos);
  if (response) return response;

  try {
    const { id } = c.req.param();
    return c.json(await getManagementSession(id));
  } catch (error) {
    return errorResponse(error);
  }
});
