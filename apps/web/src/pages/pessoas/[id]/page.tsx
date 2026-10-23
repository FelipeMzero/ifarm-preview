import { useRouteParams } from "@/lib/route-params";
import { useNavigate } from "react-router";
import PersonForm from "@/features/person/PersonForm";

export default function Page() {
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
