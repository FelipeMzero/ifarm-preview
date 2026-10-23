import { useRouteParams } from "@/lib/route-params";
import { useNavigate } from "react-router";
import { ManagementSessionForm } from "@/features/management-session/ManagementSessionForm";

export default function Page() {
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
