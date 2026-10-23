import { useRouteParams } from "@/lib/route-params";
import AnimalDetails from "@/features/animal/AnimalDetails";

export default function Page() {
  const { id } = useRouteParams<"id">();

  return (
    <div className="flex justify-center p-8">
      <AnimalDetails id={id} />
    </div>
  );
}
