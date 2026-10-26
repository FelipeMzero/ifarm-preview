import { Hono } from "hono";
import { createHealthManagementTypeRoute } from "./create-health-management-type/route";
import { deleteHealthManagementTypeRoute } from "./delete-health-management-type/route";
import { listHealthManagementTypesRoute } from "./list-health-management-types/route";
import { toggleHealthManagementTypeStatusRoute } from "./toggle-health-management-type-status/route";
import { updateHealthManagementTypeRoute } from "./update-health-management-type/route";

// As operações de tipo de manejo sanitário, cada uma na própria pasta (endpoint em route.ts,
// o que ela faz em handler.ts), montadas em /api/health-management-type.
export const healthManagementTypeRoutes = new Hono();

healthManagementTypeRoutes.route("/", listHealthManagementTypesRoute);
healthManagementTypeRoutes.route("/", createHealthManagementTypeRoute);
healthManagementTypeRoutes.route("/", updateHealthManagementTypeRoute);
healthManagementTypeRoutes.route("/", deleteHealthManagementTypeRoute);
healthManagementTypeRoutes.route("/", toggleHealthManagementTypeStatusRoute);
