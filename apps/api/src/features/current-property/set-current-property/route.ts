import { Hono } from "hono";
import { currentPropertySchema } from "@ifarm/shared";
import { errorResponse, validationErrorResponse } from "../../../http";
import { requireSession } from "../../../session";
import { setCurrentProperty } from "./handler";

export const setCurrentPropertyRoute = new Hono();

setCurrentPropertyRoute.put("/current-property", async (c) => {
  const { session, response } = await requireSession();
  if (response) return response;

  try {
    const validation = currentPropertySchema.safeParse(await c.req.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    const data = await setCurrentProperty(
      session.user.id,
      validation.data.propertyId,
    );
    return c.json({ data });
  } catch (error) {
    return errorResponse(error);
  }
});
