import { Hono } from "hono";
import { createReceptionRoute } from "./create-reception/route";
import { getReceptionPurchaseRoute } from "./get-reception-purchase/route";
import { listReceptionPurchasesRoute } from "./list-reception-purchases/route";

// As operações da área de recepções, cada uma na própria pasta (endpoint em route.ts, o que
// ela faz em handler.ts), montadas em /api/reception.
export const receptionRoutes = new Hono();

receptionRoutes.route("/", listReceptionPurchasesRoute);
receptionRoutes.route("/", getReceptionPurchaseRoute);
receptionRoutes.route("/", createReceptionRoute);
