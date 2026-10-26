import { Hono } from "hono";
import { geocodeQuerySchema } from "@ifarm/shared";
import { validationErrorResponse } from "../../../http";
import { requireSession } from "../../../session";
import { externalErrorResponse } from "../external";
import { geocode } from "./handler";

export const geocodeRoute = new Hono();

// Coordenadas aproximadas pelo endereço. Nada encontrado: { data: null }.
geocodeRoute.get("/geocode", async (c) => {
  const { response } = await requireSession();
  if (response) return response;

  const query = geocodeQuerySchema.safeParse(
    Object.fromEntries(new URL(c.req.url).searchParams),
  );
  if (!query.success) return validationErrorResponse(query.error);

  try {
    return c.json({ data: await geocode(query.data) });
  } catch (error) {
    return externalErrorResponse(
      error,
      "Não foi possível localizar o endereço.",
    );
  }
});
