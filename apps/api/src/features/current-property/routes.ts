import { Hono } from "hono";
import { getCurrentPropertyRoute } from "./get-current-property/route";
import { getCurrentPropertyDetailsRoute } from "./get-current-property-details/route";
import { setCurrentPropertyRoute } from "./set-current-property/route";

// A propriedade em que o usuário está trabalhando, cada operação na própria pasta, montadas
// em /api/user. A propriedade atual (shared.ts) também é usada pelas listagens e cadastros
// dos outros domínios.
export const currentPropertyRoutes = new Hono();

currentPropertyRoutes.route("/", getCurrentPropertyRoute);
currentPropertyRoutes.route("/", setCurrentPropertyRoute);
currentPropertyRoutes.route("/", getCurrentPropertyDetailsRoute);
