import { useNavigate } from "react-router";
import { PersonForm } from "@/features/person/PersonForm";

export default function Page() {
  const navigate = useNavigate();

  return (
    <div className="flex justify-center p-8">
      <PersonForm
        title="Nova Pessoa"
        onCancel={() => navigate(-1)}
        onSuccess={(newId) => navigate(`/pessoas/${newId}`, { replace: true })}
      />
    </div>
  );
}
