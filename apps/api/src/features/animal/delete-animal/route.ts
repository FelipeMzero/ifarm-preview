import { Hono } from "hono";
import { RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, uuidParam } from "../../../http";
import { requireSession } from "../../../session";
import { deleteAnimal } from "./handler";

export const deleteAnimalRoute = new Hono();

deleteAnimalRoute.delete(`/${uuidParam("id")}`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  try {
    const { id } = c.req.param();
    await deleteAnimal(id);
    return c.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});
