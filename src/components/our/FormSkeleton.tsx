import { Skeleton } from "../ui/skeleton"

export default function FormSkeleton() {
  return (
    <div className="flex flex-col w-full gap-8">
      <Skeleton className="h-9 w-32" />

      <div className="flex flex-col gap-4">
        <Skeleton className="h-4 w-24" />
        <div className="grid grid-cols-2 gap-4">
          <SkeletonField />
          <SkeletonField />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <SkeletonField />
          <SkeletonField />
          <SkeletonField />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Skeleton className="h-4 w-24" />
        <div className="grid grid-cols-2 gap-4">
          <SkeletonField height="h-24" />
          <SkeletonField height="h-24" />
        </div>
      </div>
    </div>
  )
}


function SkeletonField({ height = "h-8" }: { height?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Skeleton className="h-4 w-20" />
      <Skeleton className={`${height} w-full`} />
    </div>
  )
}
