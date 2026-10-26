import { Hono } from "hono";
import { addIdentifierRoute } from "./add-identifier/route";
import { cancelIdentifierRoute } from "./cancel-identifier/route";
import { correctIdentifierRoute } from "./correct-identifier/route";
import { listIdentifiersRoute } from "./list-identifiers/route";

// Brincos e RFIDs do animal (/:id/identifiers/:kind).
export const identifierRoutes = new Hono();

identifierRoutes.route("/", listIdentifiersRoute);
identifierRoutes.route("/", addIdentifierRoute);
identifierRoutes.route("/", correctIdentifierRoute);
identifierRoutes.route("/", cancelIdentifierRoute);
