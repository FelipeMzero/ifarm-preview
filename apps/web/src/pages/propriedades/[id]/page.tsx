import { useRouteParams } from "@/lib/route-params";
import { useNavigate } from "react-router";
import { PropertyForm } from "@/features/property/PropertyForm";

export default function Page() {
  const { id } = useRouteParams<"id">();
  const navigate = useNavigate();

  return (
    <div className="flex justify-center p-8">
      <PropertyForm
        id={id}
        title="Propriedade"
        onCancel={() => navigate(-1)}
        onSuccess={() => {}}
      />
    </div>
  );
}
