import { useRouteParams } from "@/lib/route-params";
import PersonDetails from "@/features/person/PersonDetails";

export default function Page() {
  const { id } = useRouteParams<"id">();

  return (
    <div className="flex justify-center p-8">
      <PersonDetails id={id} />
    </div>
  );
}
