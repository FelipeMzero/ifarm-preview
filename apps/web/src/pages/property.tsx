import { useNavigate } from "react-router";
import { useRouteParams } from "@/lib/route-params";
import { PropertyList } from "@/features/property/PropertyList";
import { PropertyForm } from "@/features/property/PropertyForm";
import { PropertyDetails } from "@/features/property/PropertyDetails";

export function PropertyListPage() {
  return (
    <div className="flex justify-center p-8">
      <PropertyList />
    </div>
  );
}

export function PropertyNewPage() {
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

export function PropertyEditPage() {
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

export function PropertyDetailsPage() {
  const { id } = useRouteParams<"id">();

  return (
    <div className="flex justify-center p-8">
      <PropertyDetails id={id} />
    </div>
  );
}
