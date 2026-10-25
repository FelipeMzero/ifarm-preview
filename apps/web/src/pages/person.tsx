import { useNavigate } from "react-router";
import { useRouteParams } from "@/lib/route-params";
import { PersonList } from "@/features/person/PersonList";
import { PersonForm } from "@/features/person/PersonForm";
import { PersonDetails } from "@/features/person/PersonDetails";

export function PersonListPage() {
  return (
    <div className="flex justify-center p-8">
      <PersonList />
    </div>
  );
}

export function PersonNewPage() {
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

export function PersonEditPage() {
  const { id } = useRouteParams<"id">();
  const navigate = useNavigate();

  return (
    <div className="flex justify-center p-8">
      <PersonForm
        id={id}
        title="Pessoa"
        onCancel={() => navigate(-1)}
        onSuccess={() => {}}
      />
    </div>
  );
}

export function PersonDetailsPage() {
  const { id } = useRouteParams<"id">();

  return (
    <div className="flex justify-center p-8">
      <PersonDetails id={id} />
    </div>
  );
}
