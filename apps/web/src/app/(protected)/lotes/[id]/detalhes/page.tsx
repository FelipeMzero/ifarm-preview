"use client";

import { use } from "react";
import BatchDetails from "@/features/batch/BatchDetails";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div className="flex justify-center p-8">
      <BatchDetails id={id} />
    </div>
  );
}
