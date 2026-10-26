import { Hono } from "hono";
import { personQuerySchema, RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse } from "../../../http";
import { requireSession } from "../../../session";
import { listPeople } from "./handler";

export const listPeopleRoute = new Hono();

listPeopleRoute.get("/", async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.pessoas);
  if (response) return response;

  try {
    const { searchParams } = new URL(c.req.url);
    const validation = personQuerySchema.safeParse(
      Object.fromEntries(searchParams),
    );
    if (!validation.success) {
      return c.json({ message: "Parâmetros inválidos." }, 400);
    }

    return c.json(await listPeople(validation.data));
  } catch (error) {
    return errorResponse(error);
  }
});
