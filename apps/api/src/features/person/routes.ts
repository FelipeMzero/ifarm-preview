import { Hono } from "hono";
import { createPersonRoute } from "./create-person/route";
import { deletePersonRoute } from "./delete-person/route";
import { getPersonRoute } from "./get-person/route";
import { listPeopleRoute } from "./list-people/route";
import { togglePersonStatusRoute } from "./toggle-person-status/route";
import { updatePersonRoute } from "./update-person/route";

// As operações de pessoa, cada uma na própria pasta (endpoint em route.ts, o que ela faz em
// handler.ts), montadas em /api/person.
export const personRoutes = new Hono();

personRoutes.route("/", listPeopleRoute);
personRoutes.route("/", getPersonRoute);
personRoutes.route("/", createPersonRoute);
personRoutes.route("/", updatePersonRoute);
personRoutes.route("/", deletePersonRoute);
personRoutes.route("/", togglePersonStatusRoute);
