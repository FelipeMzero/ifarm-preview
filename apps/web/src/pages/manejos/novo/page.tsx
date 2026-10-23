import { useNavigate } from "react-router";
import { ManagementSessionForm } from "@/features/management-session/ManagementSessionForm";

export default function Page() {
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
