import { useNavigate } from "react-router";
import { useRouteParams } from "@/lib/route-params";
import { AnimalList } from "@/features/animal/AnimalList";
import { AnimalForm } from "@/features/animal/AnimalForm";
import { AnimalEditForm } from "@/features/animal/AnimalEditForm";
import { AnimalDetails } from "@/features/animal/AnimalDetails";

export function AnimalListPage() {
  return (
    <div className="flex justify-center p-8">
      <AnimalList />
    </div>
  );
}

export function AnimalNewPage() {
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

export function AnimalEditPage() {
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

export function AnimalDetailsPage() {
  const { id } = useRouteParams<"id">();

  return (
    <div className="flex justify-center p-8">
      <AnimalDetails id={id} />
    </div>
  );
}
