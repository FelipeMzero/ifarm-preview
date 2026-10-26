import { Hono } from "hono";
import { addNeuteringRoute } from "./add-neutering/route";
import { cancelNeuteringRoute } from "./cancel-neutering/route";
import { correctNeuteringRoute } from "./correct-neutering/route";
import { listNeuteringsRoute } from "./list-neuterings/route";

// Castrações do animal (/:id/neuterings). O apoio comum (shared.ts) também é usado pelo
// cadastro do animal e pela etapa de castração das sessões de manejo.
export const neuteringRoutes = new Hono();

neuteringRoutes.route("/", listNeuteringsRoute);
neuteringRoutes.route("/", addNeuteringRoute);
neuteringRoutes.route("/", correctNeuteringRoute);
neuteringRoutes.route("/", cancelNeuteringRoute);
