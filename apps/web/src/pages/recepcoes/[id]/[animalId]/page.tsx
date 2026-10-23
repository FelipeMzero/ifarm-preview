import { useRouteParams } from "@/lib/route-params";
import { AnimalStepPage } from "@/features/management-session/AnimalStepPage";

// Mesmas telas de etapa do registro de manejo, voltando para a lista da recepção.
// Abre no primeiro passo pendente; os passos são URLs filhas (ver [passo]) que o
// próprio AnimalStepPage troca sem remontar a página.
export default function Page() {
  const { id, animalId } = useRouteParams<"id" | "animalId">();

  return (
    <div className="flex justify-center p-8">
      <AnimalStepPage
        sessionId={id}
        animalId={animalId}
        boardPath={`/recepcoes/${id}`}
      />
    </div>
  );
}
