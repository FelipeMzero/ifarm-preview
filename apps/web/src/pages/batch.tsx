import { useNavigate } from "react-router";
import { useRouteParams } from "@/lib/route-params";
import { BatchList } from "@/features/batch/BatchList";
import { BatchForm } from "@/features/batch/BatchForm";
import { BatchDetails } from "@/features/batch/BatchDetails";

export function BatchListPage() {
  return (
    <div className="flex justify-center p-8">
      <BatchList />
    </div>
  );
}

export function BatchNewPage() {
  const navigate = useNavigate();

  return (
    <div className="flex justify-center p-8">
      <BatchForm
        title="Novo Lote"
        onCancel={() => navigate(-1)}
        onSuccess={(newId) => navigate(`/lotes/${newId}`, { replace: true })}
      />
    </div>
  );
}

export function BatchEditPage() {
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

export function BatchDetailsPage() {
  const { id } = useRouteParams<"id">();

  return (
    <div className="flex justify-center p-8">
      <BatchDetails id={id} />
    </div>
  );
}
