import { Hono } from "hono";
import { RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, uuidParam } from "../../../http";
import { requireSession } from "../../../session";
import { deleteBreed } from "./handler";

export const deleteBreedRoute = new Hono();

deleteBreedRoute.delete(`/${uuidParam("id")}`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.racas);
  if (response) return response;

  try {
    const { id } = c.req.param();
    await deleteBreed(id);
    return c.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});
