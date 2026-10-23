import { useNavigate } from "react-router";
import AnimalForm from "@/features/animal/AnimalForm";

export default function Page() {
  const navigate = useNavigate();

  return (
    <div className="flex justify-center p-8">
      <AnimalForm
        title="Novo Animal"
        onCancel={() => navigate(-1)}
        onSuccess={() => navigate("/animais")}
      />
    </div>
  );
}
