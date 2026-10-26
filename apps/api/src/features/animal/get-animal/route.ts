import { Hono } from "hono";
import { RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, uuidParam } from "../../../http";
import { requireSession } from "../../../session";
import { getAnimal } from "./handler";

export const getAnimalRoute = new Hono();

getAnimalRoute.get(`/${uuidParam("id")}`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  try {
    const { id } = c.req.param();
    return c.json(await getAnimal(id));
  } catch (error) {
    return errorResponse(error);
  }
});
