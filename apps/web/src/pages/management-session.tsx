import { useNavigate } from "react-router";
import { useRouteParams } from "@/lib/route-params";
import { ManagementSessionList } from "@/features/management-session/ManagementSessionList";
import { ManagementSessionForm } from "@/features/management-session/ManagementSessionForm";
import { RegistrationBoard } from "@/features/management-session/RegistrationBoard";
import { AnimalStepPage } from "@/features/management-session/AnimalStepPage";

export function ManagementSessionListPage() {
  return (
    <div className="flex justify-center p-8">
      <ManagementSessionList />
    </div>
  );
}

export function ManagementSessionNewPage() {
  const navigate = useNavigate();

  return (
    <div className="flex justify-center p-8">
      <ManagementSessionForm
        title="Nova Sessão de Manejo"
        onCancel={() => navigate(-1)}
        onSuccess={() => navigate("/manejos", { replace: true })}
      />
    </div>
  );
}

export function ManagementSessionEditPage() {
  const { id } = useRouteParams<"id">();
  const navigate = useNavigate();

  return (
    <div className="flex justify-center p-8">
      <ManagementSessionForm
        id={id}
        title="Planejamento do Manejo"
        onCancel={() => navigate(-1)}
        onSuccess={() => navigate(-1)}
      />
    </div>
  );
}

export function RegistrationPage() {
  const { id } = useRouteParams<"id">();

  return (
    <div className="flex justify-center p-8">
      <RegistrationBoard id={id} />
    </div>
  );
}

// Registro do animal, nas URLs /<animal> (abre no primeiro passo pendente) e /<animal>/<passo>
// (link ou recarregar a página). Dentro da tela, trocar de passo só troca a URL, sem remontar.
export function RegistrationAnimalPage() {
  const { id, animalId } = useRouteParams<"id" | "animalId">();

  return (
    <div className="flex justify-center p-8">
      <AnimalStepPage sessionId={id} animalId={animalId} />
    </div>
  );
}
