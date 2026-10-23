import { lazyComponent } from "@/lib/lazy";

const BatchTransferList = lazyComponent(
  () => import("@/features/batch-transfer/BatchTransferList"),
  {
    loading: () => (
      <div className="flex min-h-100 items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    ),
  },
);

export default function Page() {
  return (
    <div className="flex justify-center p-8">
      <BatchTransferList />
    </div>
  );
}
