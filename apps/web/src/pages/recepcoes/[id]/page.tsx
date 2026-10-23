import { useRouteParams } from "@/lib/route-params";
import { ReceptionBoard } from "@/features/reception/ReceptionBoard";

export default function Page() {
  const { id } = useRouteParams<"id">();

  return (
    <div className="flex justify-center p-8">
      <ReceptionBoard id={id} />
    </div>
  );
}
