import type { ReceiveAnimalData } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import {
  findReception,
  receiveAnimal,
} from "../../../purchase/reception.public";
import {
  requireManagementDate,
  requireSessionIn,
  StepError,
} from "../../shared";

// Recebe um animal que desceu do caminhão: cria o animal (ativo, no lote de entrada),
// liga-o à categoria da compra e o inclui na sessão para os manejos da recepção.
export async function receiveSessionAnimal(
  id: string,
  data: ReceiveAnimalData,
) {
  const animalId = await prisma.$transaction(async (tx) => {
    const session = requireManagementDate(
      await requireSessionIn(
        tx,
        id,
        ["in_progress"],
        "Inicie a recepção para receber animais.",
      ),
    );
    const reception = await findReception(tx, id);
    if (!reception) {
      throw new StepError("Esta sessão não é uma recepção de compra.", 400);
    }
    return receiveAnimal(tx, session, reception, data);
  });
  return { animalId };
}
