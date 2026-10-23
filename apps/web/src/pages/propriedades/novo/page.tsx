import { useNavigate } from "react-router";
import PropertyForm from "@/features/property/PropertyForm";

export default function Page() {
  const navigate = useNavigate();

  return (
    <div className="flex justify-center p-8">
      <PropertyForm
        title="Nova Propriedade"
        onCancel={() => navigate(-1)}
        onSuccess={(newId) =>
          navigate(`/propriedades/${newId}`, { replace: true })
        }
      />
    </div>
  );
}
