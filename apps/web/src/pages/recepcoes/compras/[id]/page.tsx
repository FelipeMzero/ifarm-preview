import { useRouteParams } from "@/lib/route-params";
import { ReceptionPurchaseDetail } from "@/features/reception/ReceptionPurchaseDetail";

export default function Page() {
  const { id } = useRouteParams<"id">();

  return (
    <div className="flex justify-center p-8">
      <ReceptionPurchaseDetail id={id} />
    </div>
  );
}
