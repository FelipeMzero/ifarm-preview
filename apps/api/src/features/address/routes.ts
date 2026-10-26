import { Hono } from "hono";
import { geocodeRoute } from "./geocode/route";
import { lookupTimeZoneRoute } from "./lookup-time-zone/route";
import { lookupZipCodeRoute } from "./lookup-zip-code/route";

// Consultas de endereço e localização, cada uma na própria pasta, montadas em /api/address. A
// gravação do endereço de pessoas e propriedades (persistence.ts) é usada pelos cadastros delas.
export const addressRoutes = new Hono();

addressRoutes.route("/", lookupZipCodeRoute);
addressRoutes.route("/", geocodeRoute);
addressRoutes.route("/", lookupTimeZoneRoute);
