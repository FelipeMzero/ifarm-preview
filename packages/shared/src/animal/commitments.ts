// Compromissos pendentes dos animais: operações abertas que já contam com o animal e
// com as quais outra operação não pode conflitar. As regras estão documentadas em
// docs/data-dictionary.md, seção 2.9; ao mudar esta tabela, atualize a documentação
// e os casos de commitments.test.ts.
//
// Módulo puro (sem banco): a API busca os compromissos (server/animal/commitments.ts)
// e as telas usam as mesmas regras para avisar antes de salvar.

import { STEP_TYPE_LABELS, type StepType } from "../management-session/steps";

export type Commitment =
  // Recepção de compra ainda não concluída: o animal ainda pode deixar de existir.
  | { kind: "reception"; id: string; title: string }
  // Sessão de manejo aberta (planejada ou em andamento), com as chaves das etapas
  // (ver stepKey: o sanitário se distingue pelo procedimento).
  | { kind: "session"; id: string; title: string; stepKeys: readonly string[] }
  // Transferência de lote pendente e isolada (a da apartação pertence à sessão).
  | { kind: "transfer"; id: string; destinationBatchName: string };

// O que se pretende fazer com o animal.
export type CommitmentIntent =
  // Consolidar a recepção de compra em que o animal foi recebido.
  | { kind: "reception" }
  // Participar de uma sessão com estas etapas.
  | { kind: "session"; stepKeys: readonly string[] }
  // Entrar numa transferência de lote.
  | { kind: "transfer" }
  // Trocar de lote diretamente, pelo cadastro do animal.
  | { kind: "batchChange" }
  // Registro avulso no histórico do animal.
  | { kind: "record"; type: RecordType };

export type RecordType = Extract<
  StepType,
  "weighing" | "neutering" | "tag" | "rfid"
>;

// A própria operação, ignorada ao checar uma edição ou consolidação.
export type CommitmentExclusion = { sessionId?: string; transferId?: string };

// "block" impede a operação; "warn" só avisa (ex.: registrar castração avulsa num
// animal que tem castração pendente numa sessão aberta, caso de recastração).
export type Conflict = { commitment: Commitment; severity: "block" | "warn" };

// Etapas que não podem estar pendentes em duas sessões abertas ao mesmo tempo. A
// pesagem fica de fora: cada pesagem é um registro próprio, com a própria data.
function isExclusiveStep(key: string) {
  return key !== "weighing";
}

const decidesBatch = (c: Commitment) =>
  c.kind === "transfer" ||
  (c.kind === "session" && c.stepKeys.includes("batch"));

function severityFor(
  commitment: Commitment,
  intent: CommitmentIntent,
): Conflict["severity"] | null {
  // A recepção aberta é exclusiva, nos dois sentidos.
  if (commitment.kind === "reception" || intent.kind === "reception") {
    return "block";
  }

  switch (intent.kind) {
    case "session":
      if (commitment.kind === "session") {
        return commitment.stepKeys.some(
          (key) => isExclusiveStep(key) && intent.stepKeys.includes(key),
        )
          ? "block"
          : null;
      }
      // Transferência pendente e apartação decidiriam, as duas, o lote do animal.
      return intent.stepKeys.includes("batch") ? "block" : null;

    case "transfer":
    case "batchChange":
      return decidesBatch(commitment) ? "block" : null;

    case "record":
      return intent.type !== "weighing" &&
        commitment.kind === "session" &&
        commitment.stepKeys.includes(intent.type)
        ? "warn"
        : null;
  }
}

export function conflictsFor(
  commitments: Commitment[],
  intent: CommitmentIntent,
): Conflict[] {
  return commitments.flatMap((commitment) => {
    const severity = severityFor(commitment, intent);
    return severity ? [{ commitment, severity }] : [];
  });
}

function stepLabel(key: string) {
  const type = key.split(":")[0] as StepType;
  return STEP_TYPE_LABELS[type]?.toLowerCase() ?? key;
}

// Descrição do compromisso para mensagens, com as etapas relevantes para o conflito.
export function describeCommitment(
  commitment: Commitment,
  intent?: CommitmentIntent,
) {
  switch (commitment.kind) {
    case "reception":
      return `recepção em andamento "${commitment.title}"`;
    case "transfer":
      return `transferência pendente para o lote "${commitment.destinationBatchName}"`;
    case "session": {
      const relevant = commitment.stepKeys.filter((key) => {
        switch (intent?.kind) {
          case "session":
            return isExclusiveStep(key) && intent.stepKeys.includes(key);
          case "record":
            return key === intent.type;
          case "transfer":
          case "batchChange":
            return key === "batch";
          default:
            return false;
        }
      });
      const steps = [...new Set(relevant.map(stepLabel))];
      return `sessão de manejo "${commitment.title}"${
        steps.length ? ` (${steps.join(", ")})` : ""
      }`;
    }
  }
}

// Por que o animal não pode entrar na operação (null = disponível).
export function blockingReason(
  commitments: Commitment[],
  intent: CommitmentIntent,
): string | null {
  const blocks = conflictsFor(commitments, intent).filter(
    (c) => c.severity === "block",
  );
  return blocks.length
    ? blocks.map((c) => describeCommitment(c.commitment, intent)).join("; ")
    : null;
}
