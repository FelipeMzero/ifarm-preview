import { Hono } from "hono";
import { animalQuerySchema, RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse } from "../../../http";
import { requireSession } from "../../../session";
import { listAnimals } from "./handler";

export const listAnimalsRoute = new Hono();

listAnimalsRoute.get("/", async (c) => {
  const { response, session } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  try {
    const { searchParams } = new URL(c.req.url);
    const validation = animalQuerySchema.safeParse(
      Object.fromEntries(searchParams),
    );
    if (!validation.success) {
      return c.json({ message: "Parâmetros inválidos." }, 400);
    }

    return c.json(await listAnimals(validation.data, session.user.id));
  } catch (error) {
    return errorResponse(error);
  }
});
