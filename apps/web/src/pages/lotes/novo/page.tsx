import { useNavigate } from "react-router";
import { BatchForm } from "@/features/batch/BatchForm";

export default function Page() {
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
