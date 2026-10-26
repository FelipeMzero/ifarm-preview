import { Hono } from "hono";
import { addParticipantsRoute } from "./add-participants/route";
import { removeParticipantRoute } from "./remove-participant/route";

// Animais da sessão fora do planejamento: incluir (/:id/participants) e tirar
// (/:id/participants/:animalId).
export const participantRoutes = new Hono();

participantRoutes.route("/", addParticipantsRoute);
participantRoutes.route("/", removeParticipantRoute);
