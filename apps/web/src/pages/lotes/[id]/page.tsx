import { useRouteParams } from "@/lib/route-params";
import { useNavigate } from "react-router";
import { BatchForm } from "@/features/batch/BatchForm";

export default function Page() {
  const { id } = useRouteParams<"id">();
  const navigate = useNavigate();

  return (
    <div className="flex justify-center p-8">
      <BatchForm
        id={id}
        title="Editar Lote"
        onCancel={() => navigate(-1)}
        onSuccess={() => {}}
      />
    </div>
  );
}
