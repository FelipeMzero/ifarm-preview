import { useRouteParams } from "@/lib/route-params";
import BatchDetails from "@/features/batch/BatchDetails";

export default function Page() {
  const { id } = useRouteParams<"id">();

  return (
    <div className="flex justify-center p-8">
      <BatchDetails id={id} />
    </div>
  );
}
