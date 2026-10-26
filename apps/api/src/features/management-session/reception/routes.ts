import { Hono } from "hono";
import { receiveSessionAnimalRoute } from "./receive-session-animal/route";
import { updateReceptionDocumentsRoute } from "./update-reception-documents/route";

// Sessão de recepção de compra (/:id/reception): documentos da carga e animais recebidos.
export const receptionRoutes = new Hono();

receptionRoutes.route("/", updateReceptionDocumentsRoute);
receptionRoutes.route("/", receiveSessionAnimalRoute);
