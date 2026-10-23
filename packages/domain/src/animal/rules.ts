import {
  ANIMAL_STATUS_LABELS,
  conflictsFor,
  type AnimalStatus,
  type AnimalUpdateData,
  type Commitment,
  type CommitmentIntent,
} from "@ifarm/shared";

// Regras comuns às correções de registros do animal (pesagem, castração, brinco/RFID).

// Um registro feito em sessão de manejo tem a data da sessão: a correção não muda a data.
// Devolve a mensagem de erro (null = pode). `record` é o nome do registro ("pesagem"...).
export function sessionDateLock(
  saved: { managementId: string | null },
  newDate: string | undefined,
  record: string,
): string | null {
  if (!newDate || !saved.managementId) return null;
  return `A data de uma ${record} feita em sessão de manejo segue a data da sessão.`;
}

// O valor lançado originalmente é guardado só na primeira correção que o muda (as
// seguintes já o encontram guardado).
export function keepsOriginal(changed: boolean, savedOriginal: unknown) {
  return changed && savedOriginal == null;
}

// Operações da edição pelo cadastro que dependem dos compromissos do animal em
// operações abertas (troca de lote e registros novos).
export function updateCommitmentIntents(
  data: Pick<
    AnimalUpdateData,
    "newBatchId" | "newTag" | "newRfid" | "neuteredAt" | "newWeightKg"
  >,
): CommitmentIntent[] {
  const intents: CommitmentIntent[] = [];
  if (data.newBatchId) intents.push({ kind: "batchChange" });
  if (data.newTag !== undefined) intents.push({ kind: "record", type: "tag" });
  if (data.newRfid !== undefined)
    intents.push({ kind: "record", type: "rfid" });
  if (data.neuteredAt) intents.push({ kind: "record", type: "neutering" });
  if (data.newWeightKg != null) {
    intents.push({ kind: "record", type: "weighing" });
  }
  return intents;
}

// --- Compromissos ---

// Animais em conflito com a intenção, agrupados pelo compromisso que os prende. Só os
// conflitos que bloqueiam; os avisos ficam a cargo das telas.
export function blockingConflicts(
  commitmentsByAnimal: Map<string, Commitment[]>,
  intent: CommitmentIntent,
) {
  const groups = new Map<
    string,
    { commitment: Commitment; animalIds: string[] }
  >();
  for (const [animalId, list] of commitmentsByAnimal) {
    for (const { commitment, severity } of conflictsFor(list, intent)) {
      if (severity !== "block") continue;
      const key = `${commitment.kind}:${commitment.id}`;
      const group = groups.get(key) ?? { commitment, animalIds: [] };
      group.animalIds.push(animalId);
      groups.set(key, group);
    }
  }
  return [...groups.values()];
}

// --- Exclusão ---

// Compra que existe só em função de um animal (a "compra avulsa" do cadastro com origem
// Compra): uma categoria, uma recepção, um animal comprado, e a sessão de recepção sem
// outros participantes nem manejos.
export function isStandalonePurchase(
  event: { categories: number; receptions: number; purchasedAnimals: number },
  session: {
    participants: number;
    healthManagements: number;
    animalBatchTransfers: number;
    animalPropertyTransfers: number;
    hasStepManagements: boolean;
  },
) {
  return (
    event.categories === 1 &&
    event.receptions === 1 &&
    event.purchasedAnimals === 1 &&
    session.participants === 1 &&
    session.healthManagements === 0 &&
    session.animalBatchTransfers === 0 &&
    session.animalPropertyTransfers === 0 &&
    !session.hasStepManagements
  );
}

// A exclusão desfaz um cadastro feito por engano: animal com história no rebanho
// (saída, compra que não é a avulsa, movimentações, manejos) não é excluído. Devolve o
// motivo do bloqueio (null = pode, pelo que as contagens mostram).
export function animalDeletionBlocker(
  animal: {
    status: string;
    count: {
      animalPropertyHistories: number;
      animalBatchHistories: number;
      propertyTransferItems: number;
      batchTransferItems: number;
      managementParticipants: number;
      healthManagementItems: number;
      animalBrandings: number;
      purchasedAnimals: number;
    };
  },
  standalonePurchase: boolean,
): string | null {
  const { count } = animal;
  if (animal.status !== "ACTIVE") {
    return "Não é possível excluir um animal que já saiu do rebanho.";
  }
  if (count.purchasedAnimals > 0 && !standalonePurchase) {
    return "Não é possível excluir: o animal está vinculado a uma compra.";
  }
  if (
    count.animalPropertyHistories > 1 ||
    count.animalBatchHistories > 1 ||
    count.propertyTransferItems > 0 ||
    count.batchTransferItems > 0
  ) {
    return "Não é possível excluir: o animal já foi movimentado entre propriedades ou lotes.";
  }
  // A compra avulsa traz a participação na sessão de recepção dela.
  const ownParticipations = count.purchasedAnimals > 0 ? 1 : 0;
  if (
    count.managementParticipants > ownParticipations ||
    count.healthManagementItems > 0 ||
    count.animalBrandings > 0
  ) {
    return MANAGED_MESSAGE;
  }
  return null;
}

const MANAGED_MESSAGE =
  "Não é possível excluir: o animal já possui manejos registrados.";

// Os registros avulsos do cadastro são no máximo um de cada tipo (pesagem, brinco, RFID,
// castração), fora de sessão de manejo. Mais de um (inclusive corrigidos/cancelados)
// indica manejos posteriores. Recebe os registros de cada tipo.
export function laterRecordsBlocker(
  recordsByType: { managementId: string | null }[][],
): string | null {
  const later = recordsByType.some(
    (records) =>
      records.length > 1 || records.some((r) => r.managementId !== null),
  );
  return later ? MANAGED_MESSAGE : null;
}

// --- Disponibilidade ---

// Por que o animal não pode mais participar de uma operação em aberto da propriedade
// (ex.: morreu ou foi transferido depois de ser incluído nela); null = pode participar.
// A API manda o motivo pronto às telas (campo unavailableReason).
// Ver "Operações com animais selecionados" em docs/requirements/comum.md.
export function unavailableReason(
  animal: { status: AnimalStatus; currentPropertyId: string },
  propertyId: string,
): string | null {
  if (animal.status !== "ACTIVE") return ANIMAL_STATUS_LABELS[animal.status];
  if (animal.currentPropertyId !== propertyId) return "Em outra propriedade";
  return null;
}

export function unavailableAnimalsMessage(labels: string) {
  return `Animais que não estão mais ativos na propriedade: ${labels}. Remova-os antes de consolidar.`;
}

// --- Identificação em mensagens ---

// Identificação legível do animal em mensagens (brinco → RFID → ID).
export function animalLabel(a: {
  code: number;
  currentTag: string | null;
  currentRfid: string | null;
}) {
  if (a.currentTag) return `brinco ${a.currentTag}`;
  if (a.currentRfid) return `RFID ${a.currentRfid}`;
  return `ID ${a.code}`;
}

// Lista curta para mensagens: os primeiros `max` itens e "e mais N".
export function summarize(labels: string[], max = 5) {
  const shown = labels.slice(0, max).join(", ");
  return labels.length > max ? `${shown} e mais ${labels.length - max}` : shown;
}
