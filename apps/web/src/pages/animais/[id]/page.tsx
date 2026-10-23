import { useRouteParams } from "@/lib/route-params";
import { useNavigate } from "react-router";
import { AnimalEditForm } from "@/features/animal/AnimalEditForm";

export default function Page() {
  const { id } = useRouteParams<"id">();
  const navigate = useNavigate();

  return (
    <div className="flex justify-center p-8">
      <AnimalEditForm
        id={id}
        title="Editar Animal"
        onCancel={() => navigate(-1)}
        onSuccess={() => {}}
      />
    </div>
  );
}
