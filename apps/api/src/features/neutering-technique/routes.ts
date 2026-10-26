import { Hono } from "hono";
import { createNeuteringTechniqueRoute } from "./create-neutering-technique/route";
import { deleteNeuteringTechniqueRoute } from "./delete-neutering-technique/route";
import { listNeuteringTechniquesRoute } from "./list-neutering-techniques/route";
import { toggleNeuteringTechniqueStatusRoute } from "./toggle-neutering-technique-status/route";
import { updateNeuteringTechniqueRoute } from "./update-neutering-technique/route";

// As operações de técnica de castração, cada uma na própria pasta (endpoint em route.ts, o
// que ela faz em handler.ts), montadas em /api/neutering-technique.
export const neuteringTechniqueRoutes = new Hono();

neuteringTechniqueRoutes.route("/", listNeuteringTechniquesRoute);
neuteringTechniqueRoutes.route("/", createNeuteringTechniqueRoute);
neuteringTechniqueRoutes.route("/", updateNeuteringTechniqueRoute);
neuteringTechniqueRoutes.route("/", deleteNeuteringTechniqueRoute);
neuteringTechniqueRoutes.route("/", toggleNeuteringTechniqueStatusRoute);
