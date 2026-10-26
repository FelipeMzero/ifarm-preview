import { Hono } from "hono";
import { timeZoneQuerySchema } from "@ifarm/shared";
import { validationErrorResponse } from "../../../http";
import { requireSession } from "../../../session";
import { lookupTimeZone } from "./handler";

export const lookupTimeZoneRoute = new Hono();

// Fuso horário do Brasil em que fica o ponto. Fora do Brasil: { data: null }.
lookupTimeZoneRoute.get("/time-zone", async (c) => {
  const { response } = await requireSession();
  if (response) return response;

  const query = timeZoneQuerySchema.safeParse(
    Object.fromEntries(new URL(c.req.url).searchParams),
  );
  if (!query.success) return validationErrorResponse(query.error);

  const { latitude, longitude } = query.data;
  return c.json({ data: lookupTimeZone(latitude, longitude) });
});
