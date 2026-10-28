import { Hono } from "hono";
import { clearSessionAnimalStepRoute } from "./clear-session-animal-step/route";
import { getSessionAnimalRoute } from "./get-session-animal/route";
import { saveSessionAnimalStepRoute } from "./save-session-animal-step/route";

// Um animal da sessão (/:id/animals/:animalId): o que as telas de etapa precisam e o
// registro de cada etapa. O contexto (animal-context.ts) e o registro (records.ts) também
// são usados pelo seed.
export const sessionAnimalRoutes = new Hono();

sessionAnimalRoutes.route("/", getSessionAnimalRoute);
sessionAnimalRoutes.route("/", saveSessionAnimalStepRoute);
sessionAnimalRoutes.route("/", clearSessionAnimalStepRoute);
