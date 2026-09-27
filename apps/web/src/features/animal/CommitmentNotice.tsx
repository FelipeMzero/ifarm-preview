import { CircleAlert, TriangleAlert } from "lucide-react";
import {
  conflictsFor,
  describeCommitment,
  type Commitment,
  type CommitmentIntent,
} from "@/lib/animal-commitments";

// Avisa, antes de salvar, que o animal tem operação em aberto que conflita com o que
// se vai fazer. O servidor aplica a mesma regra: o bloqueio aqui é só antecipado. Os
// compromissos vêm carregados pela tela (junto com o animal), para o aviso já aparecer
// quando a janela abre.
export function CommitmentNotice({
  commitments,
  intent,
}: {
  commitments: Commitment[];
  intent: CommitmentIntent;
}) {
  const conflicts = conflictsFor(commitments, intent);
  if (!conflicts.length) return null;

  return (
    <div className="space-y-1">
      {conflicts.map(({ commitment, severity }) => {
        const where = describeCommitment(commitment, intent);
        return severity === "block" ? (
          <p
            key={commitment.id}
            className="flex items-start gap-1.5 text-xs text-destructive"
          >
            <CircleAlert className="mt-0.5 size-3.5 shrink-0" />
            Animal em {where}: conclua ou retire o animal dela antes deste
            registro.
          </p>
        ) : (
          <p
            key={commitment.id}
            className="flex items-start gap-1.5 text-xs text-warning"
          >
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
            Pendente em {where}: o registro de lá também valerá quando a sessão
            for consolidada. Registre aqui só se for um procedimento à parte.
          </p>
        );
      })}
    </div>
  );
}
