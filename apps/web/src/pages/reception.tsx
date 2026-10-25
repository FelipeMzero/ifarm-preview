import { useRouteParams } from "@/lib/route-params";
import { ReceptionPurchaseList } from "@/features/reception/ReceptionPurchaseList";
import { ReceptionPurchaseDetail } from "@/features/reception/ReceptionPurchaseDetail";
import { ReceptionBoard } from "@/features/reception/ReceptionBoard";
import { AnimalStepPage } from "@/features/management-session/AnimalStepPage";

export function ReceptionPurchaseListPage() {
  return (
    <div className="flex justify-center p-8">
      <ReceptionPurchaseList />
    </div>
  );
}

export function ReceptionPurchasePage() {
  const { id } = useRouteParams<"id">();

  return (
    <div className="flex justify-center p-8">
      <ReceptionPurchaseDetail id={id} />
    </div>
  );
}

export function ReceptionPage() {
  const { id } = useRouteParams<"id">();

  return (
    <div className="flex justify-center p-8">
      <ReceptionBoard id={id} />
    </div>
  );
}

// Mesmas telas de etapa do registro de manejo, voltando para a lista da recepção, nas URLs
// /<animal> (abre no primeiro passo pendente) e /<animal>/<passo>.
export function ReceptionAnimalPage() {
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
