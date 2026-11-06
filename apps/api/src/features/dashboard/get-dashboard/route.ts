import { Hono } from "hono";
import { dashboardQuerySchema } from "@ifarm/shared";
import { errorResponse, validationErrorResponse } from "../../../http";
import { requireSession } from "../../../session";
import { getDashboard } from "./handler";

export const getDashboardRoute = new Hono();

getDashboardRoute.get("/", async (c) => {
  const { response } = await requireSession();
  if (response) return response;

  try {
    const { searchParams } = new URL(c.req.url);
    const validation = dashboardQuerySchema.safeParse(
      Object.fromEntries(searchParams),
    );
    if (!validation.success) return validationErrorResponse(validation.error);

    const data = await getDashboard(validation.data);
    return c.json({ data });
  } catch (error) {
    return errorResponse(error);
  }
});
