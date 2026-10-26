import { Hono } from "hono";
import { addWeighingRoute } from "./add-weighing/route";
import { cancelWeighingRoute } from "./cancel-weighing/route";
import { correctWeighingRoute } from "./correct-weighing/route";
import { listWeighingsRoute } from "./list-weighings/route";

// Pesagens do animal (/:id/weighings). O apoio comum (shared.ts) também é usado pelo painel
// do lote e pela etapa de pesagem das sessões de manejo.
export const weighingRoutes = new Hono();

weighingRoutes.route("/", listWeighingsRoute);
weighingRoutes.route("/", addWeighingRoute);
weighingRoutes.route("/", correctWeighingRoute);
weighingRoutes.route("/", cancelWeighingRoute);
