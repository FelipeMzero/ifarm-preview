import { Hono } from "hono";
import { createPropertyRoute } from "./create-property/route";
import { deletePropertyRoute } from "./delete-property/route";
import { getPropertyRoute } from "./get-property/route";
import { listPropertiesRoute } from "./list-properties/route";
import { listPropertyOptionsRoute } from "./list-property-options/route";
import { togglePropertyStatusRoute } from "./toggle-property-status/route";
import { updatePropertyRoute } from "./update-property/route";

// As operações de propriedade, cada uma na própria pasta (endpoint em route.ts, o que ela faz
// em handler.ts), montadas em /api/property. Caminhos fixos (/options) antes dos com :id.
export const propertyRoutes = new Hono();

propertyRoutes.route("/", listPropertyOptionsRoute);
propertyRoutes.route("/", listPropertiesRoute);
propertyRoutes.route("/", getPropertyRoute);
propertyRoutes.route("/", createPropertyRoute);
propertyRoutes.route("/", updatePropertyRoute);
propertyRoutes.route("/", deletePropertyRoute);
propertyRoutes.route("/", togglePropertyStatusRoute);
