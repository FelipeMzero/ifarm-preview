import { Hono } from "hono";
import { RESOURCE_ACCESS } from "@ifarm/shared";
import { errorResponse, uuidParam } from "../../../http";
import { requireSession } from "../../../session";
import { toggleHealthManagementTypeStatus } from "./handler";

export const toggleHealthManagementTypeStatusRoute = new Hono();

// Ativa ou desativa o tipo de manejo sanitário.
toggleHealthManagementTypeStatusRoute.patch(
  `/${uuidParam("id")}`,
  async (c) => {
    const { response } = await requireSession(
      RESOURCE_ACCESS["tipos-sanitarios"],
    );
    if (response) return response;

    try {
      const { id } = c.req.param();
      const data = await toggleHealthManagementTypeStatus(id);
      return c.json({ success: true, data });
    } catch (error) {
      return errorResponse(error);
    }
  },
);
