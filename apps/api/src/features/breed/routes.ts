import { Hono } from "hono";
import { createBreedRoute } from "./create-breed/route";
import { deleteBreedRoute } from "./delete-breed/route";
import { listBreedsRoute } from "./list-breeds/route";
import { toggleBreedStatusRoute } from "./toggle-breed-status/route";
import { updateBreedRoute } from "./update-breed/route";

// As operações de raça, cada uma na própria pasta (endpoint em route.ts, o que ela faz em
// handler.ts), montadas em /api/breed.
export const breedRoutes = new Hono();

breedRoutes.route("/", listBreedsRoute);
breedRoutes.route("/", createBreedRoute);
breedRoutes.route("/", updateBreedRoute);
breedRoutes.route("/", deleteBreedRoute);
breedRoutes.route("/", toggleBreedStatusRoute);
