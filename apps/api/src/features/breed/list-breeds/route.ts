import { Hono } from "hono";
import { RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse } from "../../../http";
import { requireSession } from "../../../session";
import { listBreeds } from "./handler";

export const listBreedsRoute = new Hono();

listBreedsRoute.get("/", async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.racas);
  if (response) return response;

  try {
    return c.json({ data: await listBreeds() });
  } catch (error) {
    return errorResponse(error);
  }
});
