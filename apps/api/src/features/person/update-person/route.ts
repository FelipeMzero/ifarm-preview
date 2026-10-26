import { Hono } from "hono";
import { personSchema, RESOURCE_ACCESS } from "@ifarm/shared";
import {
  errorResponse,
  uuidParam,
  validationErrorResponse,
} from "../../../http";
import { requireSession } from "../../../session";
import { updatePerson } from "./handler";

export const updatePersonRoute = new Hono();

updatePersonRoute.put(`/${uuidParam("id")}`, async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.pessoas);
  if (response) return response;

  try {
    const { id } = c.req.param();
    const validation = personSchema.safeParse(await c.req.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    const data = await updatePerson(id, validation.data);
    return c.json({ success: true, data });
  } catch (error) {
    return errorResponse(error);
  }
});
