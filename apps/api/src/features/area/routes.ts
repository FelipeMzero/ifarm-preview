import { Hono } from "hono";
import { createAreaRoute } from "./create-area/route";
import { deleteAreaRoute } from "./delete-area/route";
import { getAreaRoute } from "./get-area/route";
import { getAreaHistoryRoute } from "./get-area-history/route";
import { listAreasRoute } from "./list-areas/route";
import { toggleAreaStatusRoute } from "./toggle-area-status/route";
import { updateAreaRoute } from "./update-area/route";

// As operações de área, cada uma na própria pasta (endpoint em route.ts, o que ela faz em
// handler.ts), montadas em /api/area. A ocupação por lote (availability.ts) também é usada
// pelas operações de lote.
export const areaRoutes = new Hono();

areaRoutes.route("/", listAreasRoute);
areaRoutes.route("/", getAreaRoute);
areaRoutes.route("/", getAreaHistoryRoute);
areaRoutes.route("/", createAreaRoute);
areaRoutes.route("/", updateAreaRoute);
areaRoutes.route("/", deleteAreaRoute);
areaRoutes.route("/", toggleAreaStatusRoute);
