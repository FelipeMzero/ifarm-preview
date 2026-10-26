import { Hono } from "hono";
import { breedSchema, RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, validationErrorResponse } from "../../../http";
import { requireSession } from "../../../session";
import { createBreed } from "./handler";

export const createBreedRoute = new Hono();

createBreedRoute.post("/", async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.racas);
  if (response) return response;

  try {
    const validation = breedSchema.safeParse(await c.req.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    const data = await createBreed(validation.data);
    return c.json({ success: true, data }, 201);
  } catch (error) {
    return errorResponse(error);
  }
});
