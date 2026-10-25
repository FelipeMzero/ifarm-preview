import { useRouteParams } from "@/lib/route-params";
import { PurchaseList } from "@/features/purchase/PurchaseList";
import { PurchaseForm } from "@/features/purchase/PurchaseForm";

export function PurchaseListPage() {
  return (
    <div className="flex justify-center p-8">
      <PurchaseList />
    </div>
  );
}

export function PurchaseNewPage() {
  return (
    <div className="flex justify-center p-8">
      <PurchaseForm />
    </div>
  );
}

export function PurchaseEditPage() {
  const { id } = useRouteParams<"id">();

  return (
    <div className="flex justify-center p-8">
      <PurchaseForm id={id} />
    </div>
  );
}
