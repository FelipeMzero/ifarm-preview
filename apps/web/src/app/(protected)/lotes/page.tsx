"use client";

import dynamic from "next/dynamic";

const BatchList = dynamic(() => import("@/features/batch/BatchList"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-100 items-center justify-center">
      <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  ),
});

export default function Page() {
  return (
    <div className="flex justify-center p-8">
      <BatchList />
    </div>
  );
}
