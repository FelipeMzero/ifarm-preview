import { Hono } from "hono";
import { personSchema, RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, validationErrorResponse } from "../../../http";
import { requireSession } from "../../../session";
import { createPerson } from "./handler";

export const createPersonRoute = new Hono();

createPersonRoute.post("/", async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.pessoas);
  if (response) return response;

  try {
    const validation = personSchema.safeParse(await c.req.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    const data = await createPerson(validation.data);
    return c.json({ success: true, data }, 201);
  } catch (error) {
    return errorResponse(error);
  }
});
