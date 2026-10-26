import { Hono } from "hono";
import { createAnimalRoute } from "./create-animal/route";
import { deleteAnimalRoute } from "./delete-animal/route";
import { getAnimalRoute } from "./get-animal/route";
import { getAnimalCommitmentsRoute } from "./get-animal-commitments/route";
import { getAnimalDetailsRoute } from "./get-animal-details/route";
import { identifierRoutes } from "./identifier/routes";
import { listAnimalsRoute } from "./list-animals/route";
import { lookupCommitmentsRoute } from "./lookup-commitments/route";
import { neuteringRoutes } from "./neutering/routes";
import { updateAnimalRoute } from "./update-animal/route";
import { weighingRoutes } from "./weighing/routes";

// As operações de animal, cada uma na própria pasta (endpoint em route.ts, o que ela faz em
// handler.ts), montadas em /api/animal; pesagens, castrações e identificadores ficam nas
// próprias pastas. Os compromissos (commitments.ts) e as regras (rules.ts) também são usados
// por transferências e sessões de manejo.
export const animalRoutes = new Hono();

animalRoutes.route("/", lookupCommitmentsRoute);
animalRoutes.route("/", listAnimalsRoute);
animalRoutes.route("/", createAnimalRoute);
animalRoutes.route("/", getAnimalRoute);
animalRoutes.route("/", updateAnimalRoute);
animalRoutes.route("/", deleteAnimalRoute);
animalRoutes.route("/", getAnimalCommitmentsRoute);
animalRoutes.route("/", getAnimalDetailsRoute);
animalRoutes.route("/", weighingRoutes);
animalRoutes.route("/", neuteringRoutes);
animalRoutes.route("/", identifierRoutes);
