import { Hono } from "hono";
import { RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, uuidParam } from "../../../http";
import { requireSession } from "../../../session";
import { deleteHealthManagementType } from "./handler";

export const deleteHealthManagementTypeRoute = new Hono();

deleteHealthManagementTypeRoute.delete(`/${uuidParam("id")}`, async (c) => {
  const { response } = await requireSession(
    RESOURCE_ACCESS["tipos-sanitarios"],
  );
  if (response) return response;

  try {
    const { id } = c.req.param();
    await deleteHealthManagementType(id);
    return c.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});
