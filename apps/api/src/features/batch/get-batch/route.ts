import { Hono } from "hono";
import { RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, uuidParam } from "../../../http";
import { requireSession } from "../../../session";
import { getBatch } from "./handler";

export const getBatchRoute = new Hono();

getBatchRoute.get(`/${uuidParam("id")}`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.lotes);
  if (response) return response;

  try {
    const { id } = c.req.param();
    return c.json(await getBatch(id));
  } catch (error) {
    return errorResponse(error);
  }
});
