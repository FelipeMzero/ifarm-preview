import { Hono } from "hono";
import { cancelManagementSessionRoute } from "./cancel-management-session/route";
import { confirmManagementSessionRoute } from "./confirm-management-session/route";
import { createManagementSessionRoute } from "./create-management-session/route";
import { getManagementOptionsRoute } from "./get-management-options/route";
import { getManagementSessionRoute } from "./get-management-session/route";
import { listManagementSessionsRoute } from "./list-management-sessions/route";
import { participantRoutes } from "./participant/routes";
import { receptionRoutes } from "./reception/routes";
import { sessionAnimalRoutes } from "./session-animal/routes";
import { startManagementSessionRoute } from "./start-management-session/route";
import { updateManagementSessionRoute } from "./update-management-session/route";

// As operações das sessões de manejo, cada uma na própria pasta (endpoint em route.ts, o que
// ela faz em handler.ts), montadas em /api/management-session; participantes, recepção e o
// registro por animal ficam nas próprias pastas. O que outros domínios usam fica nos
// arquivos *.public.ts: o modelo e as situações das etapas (session-steps.public.ts), os
// filtros de registros válidos (effective.public.ts) e o planejamento (plan.public.ts).
// Caminhos fixos (/options) antes dos com :id.
export const managementSessionRoutes = new Hono();

managementSessionRoutes.route("/", getManagementOptionsRoute);
managementSessionRoutes.route("/", listManagementSessionsRoute);
managementSessionRoutes.route("/", createManagementSessionRoute);
managementSessionRoutes.route("/", getManagementSessionRoute);
managementSessionRoutes.route("/", updateManagementSessionRoute);
managementSessionRoutes.route("/", startManagementSessionRoute);
managementSessionRoutes.route("/", confirmManagementSessionRoute);
managementSessionRoutes.route("/", cancelManagementSessionRoute);
managementSessionRoutes.route("/", participantRoutes);
managementSessionRoutes.route("/", receptionRoutes);
managementSessionRoutes.route("/", sessionAnimalRoutes);
