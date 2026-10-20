import "server-only";
import type { Prisma } from "@/server/db";
import type { DeletionPolicy } from "@/server/deletion";
import {
  animalDeletionBlocker,
  isStandalonePurchase,
  laterRecordsBlocker,
} from "./rules";

type Tx = Prisma.TransactionClient;

// Compra que existe só em função deste animal (a "compra avulsa" que o cadastro com
// origem Compra cria): uma categoria, uma recepção, um animal comprado, e a sessão de
// recepção sem outros participantes nem manejos. Retorna null se o animal não foi
// comprado ou se a compra envolve mais coisas além dele.
async function standalonePurchase(tx: Tx, animalId: string) {
  const purchased = await tx.purchasedAnimal.findUnique({
    where: { animalId },
    select: {
      id: true,
      categoryId: true,
      purchaseEvent: {
        select: {
          id: true,
          _count: {
            select: {
              categories: true,
              receptions: true,
              purchasedAnimals: true,
            },
          },
        },
      },
      reception: {
        select: {
          id: true,
          managementSession: {
            select: {
              id: true,
              weighingManagement: { select: { id: true } },
              neuteringManagement: { select: { id: true } },
              tagManagement: { select: { id: true } },
              rfidManagement: { select: { id: true } },
              brandManagement: { select: { id: true } },
              _count: {
                select: {
                  participants: true,
                  healthManagements: true,
                  animalBatchTransfers: true,
                  animalPropertyTransfers: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!purchased) return null;

  const event = purchased.purchaseEvent;
  const session = purchased.reception.managementSession;
  const isStandalone = isStandalonePurchase(event._count, {
    ...session._count,
    hasStepManagements: !!(
      session.weighingManagement ||
      session.neuteringManagement ||
      session.tagManagement ||
      session.rfidManagement ||
      session.brandManagement
    ),
  });

  if (!isStandalone) return null;

  return {
    purchasedAnimalId: purchased.id,
    categoryId: purchased.categoryId,
    eventId: event.id,
    receptionId: purchased.reception.id,
    sessionId: session.id,
  };
}

// A exclusão serve para desfazer um cadastro feito por engano. Um animal que já tem
// história no rebanho (manejos, movimentações, compra, saída) não é excluído: ele sai
// do rebanho pela mudança de status.
//
// Pertencem ao cadastro, e são apagados junto: o histórico inicial de propriedade e de
// lote, os registros avulsos que o formulário de cadastro cria (no máximo um de cada:
// pesagem, brinco, RFID e castração) e, se a origem for Compra, a compra avulsa inteira.
export const animalDeletionPolicy: DeletionPolicy = {
  async check(tx, id) {
    const animal = await tx.animal.findUnique({
      where: { id },
      select: {
        status: true,
        _count: {
          select: {
            animalPropertyHistories: true,
            animalBatchHistories: true,
            propertyTransferItems: true,
            batchTransferItems: true,
            managementParticipants: true,
            healthManagementItems: true,
            animalBrandings: true,
            purchasedAnimals: true,
          },
        },
      },
    });

    // Inexistente: deixa o remove falhar com P2025 para a rota responder 404.
    if (!animal) return null;

    // A compra só é consultada quando decide algo (animal ativo e comprado).
    const standalone =
      animal.status === "ACTIVE" &&
      animal._count.purchasedAnimals > 0 &&
      (await standalonePurchase(tx, id)) != null;
    const blocker = animalDeletionBlocker(
      { status: animal.status, count: animal._count },
      standalone,
    );
    if (blocker) return blocker;

    // Sequencial: o cliente da transação não aceita consultas em paralelo.
    const where = { animalId: id };
    const select = { managementId: true };
    const weighings = await tx.animalWeighing.findMany({ where, select });
    const taggings = await tx.animalTagging.findMany({ where, select });
    const rfidTaggings = await tx.animalRfidTagging.findMany({ where, select });
    const neuterings = await tx.animalNeutering.findMany({ where, select });

    return laterRecordsBlocker([weighings, taggings, rfidTaggings, neuterings]);
  },

  async remove(tx, id) {
    const purchase = await standalonePurchase(tx, id);
    if (purchase) {
      await tx.purchasedAnimal.delete({
        where: { id: purchase.purchasedAnimalId },
      });
      await tx.purchaseReception.delete({
        where: { id: purchase.receptionId },
      });
      await tx.managementParticipant.deleteMany({
        where: { managementSessionId: purchase.sessionId },
      });
      await tx.managementSession.delete({ where: { id: purchase.sessionId } });
      await tx.purchaseCategory.delete({ where: { id: purchase.categoryId } });
      await tx.purchaseEvent.delete({ where: { id: purchase.eventId } });
    }

    const where = { animalId: id };
    await tx.animalWeighing.deleteMany({ where });
    await tx.animalTagging.deleteMany({ where });
    await tx.animalRfidTagging.deleteMany({ where });
    await tx.animalNeutering.deleteMany({ where });
    await tx.animalPropertyHistory.deleteMany({ where });
    await tx.animalBatchHistory.deleteMany({ where });
    await tx.animal.delete({ where: { id } });
  },
};
