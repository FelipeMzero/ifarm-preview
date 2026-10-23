import { useRouteParams } from "@/lib/route-params";
import { PurchaseForm } from "@/features/purchase/PurchaseForm";

export default function Page() {
  const { id } = useRouteParams<"id">();

  return (
    <div className="flex justify-center p-8">
      <PurchaseForm id={id} />
    </div>
  );
}
