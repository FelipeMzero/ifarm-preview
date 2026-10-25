import { useRouteParams } from "@/lib/route-params";
import { PropertyDetails } from "@/features/property/PropertyDetails";

export default function Page() {
  const { id } = useRouteParams<"id">();

  return (
    <div className="flex justify-center p-8">
      <PropertyDetails id={id} />
    </div>
  );
}
