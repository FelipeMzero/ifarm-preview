"use client";

import { use } from "react";
import { ReceptionPurchaseDetail } from "@/features/reception/ReceptionPurchaseDetail";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div className="flex justify-center p-8">
      <ReceptionPurchaseDetail id={id} />
    </div>
  );
}
